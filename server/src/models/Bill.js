import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Bill title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type:     Number,
      required: [true, 'Amount is required'],
      min:      [1, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      enum: [
        'Rent', 'Electricity', 'Water', 'Internet',
        'Phone', 'Insurance', 'Subscription', 'EMI',
        'Gas', 'Credit Card', 'Other',
      ],
      default: 'Other',
    },
    dueDate: {
      type:     Number,
      required: [true, 'Due date is required'],
      min: 1, max: 31,
    },
    // Anchor month (1-12) for quarterly/yearly bills. Not used for monthly.
    dueMonth: {
      type:    Number,
      min: 1, max: 12,
      default: null,
    },
    isRecurring: {
      type:    Boolean,
      default: true,
    },
    frequency: {
      type:    String,
      enum:    ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    isPaid: {
      type:    Boolean,
      default: false,
    },
    paidDate: {
      type:    Date,
      default: null,
    },
    lastPaidMonth: {
      type:    Number,
      default: null,
    },
    lastPaidYear: {
      type:    Number,
      default: null,
    },
    autoPay: {
      type:    Boolean,
      default: false,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other', null],
      default: null,
    },
    paymentDetail: {
      type:    String,
      default: '',
      trim:    true,
    },
    notes: {
      type:    String,
      default: '',
      trim:    true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Returns the list of calendar months (1-12) this bill is anchored to,
// based on frequency. Monthly bills are due every month. Yearly bills
// have exactly one anchor month. Quarterly bills repeat every 3 months
// from the anchor (4 occurrences a year).
billSchema.methods.getAnchorMonths = function () {
  const anchor = this.dueMonth || (new Date()).getMonth() + 1;

  if (this.frequency === 'yearly') {
    return [anchor];
  }
  if (this.frequency === 'quarterly') {
    const months = [];
    for (let i = 0; i < 4; i++) {
      months.push(((anchor - 1 + i * 3) % 12) + 1);
    }
    return months;
  }
  // monthly (or unset)
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
};

// Virtual: is this bill due in the current calendar month, and not already
// paid for this specific occurrence.
billSchema.virtual('isDueThisMonth').get(function () {
  const now          = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const anchorMonths = this.getAnchorMonths();
  if (!anchorMonths.includes(currentMonth)) return false;

  const alreadyPaidThisOccurrence =
    this.lastPaidMonth === currentMonth && this.lastPaidYear === currentYear;

  return !alreadyPaidThisOccurrence;
});

// Virtual: days until the NEXT actual occurrence, correctly accounting for
// quarterly/yearly anchor months instead of assuming every month.
billSchema.virtual('daysUntilDue').get(function () {
  const now = new Date();
  const day = Math.min(Math.max(this.dueDate || 1, 1), 28);
  const anchorMonths = this.getAnchorMonths();

  const candidates = [];
  const years = [now.getFullYear(), now.getFullYear() + 1];
  years.forEach((year) => {
    anchorMonths.forEach((month) => {
      candidates.push(new Date(year, month - 1, day));
    });
  });

  const future = candidates.filter((d) => d >= now).sort((a, b) => a - b);
  const nextDue = future[0];
  if (!nextDue) return null;

  return Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
});

billSchema.set('toJSON', { virtuals: true });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;