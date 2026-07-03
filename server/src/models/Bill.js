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
    // isPaid is now a virtual property computed dynamically based on lastPaidMonth and lastPaidYear
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

// Virtual: the next actual due date for this bill, accounting for 
// payments made on previous occurrences.
billSchema.virtual('nextDueDate').get(function () {
  const now = new Date();
  const anchorMonths = this.getAnchorMonths();
  const targetDay = this.dueDate || 1;

  const candidates = [];
  // Look from current year and next year
  const years = [now.getFullYear(), now.getFullYear() + 1];
  years.forEach((year) => {
    anchorMonths.forEach((month) => {
      const daysInMonth = new Date(year, month, 0).getDate();
      const actualDay = Math.min(targetDay, daysInMonth);
      // Set to 23:59:59 so today remains a valid candidate until end of day
      candidates.push(new Date(year, month - 1, actualDay, 23, 59, 59));
    });
  });

  // Sort ascending
  candidates.sort((a, b) => a - b);

  // Find the first candidate that hasn't been paid yet.
  // A candidate is considered paid if lastPaidMonth and lastPaidYear match it.
  const unpaidCandidates = candidates.filter((d) => {
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    return !(this.lastPaidMonth === m && this.lastPaidYear === y);
  });

  // We also want to make sure we don't return past occurrences that are already
  // considered obsolete (i.e. before the current calendar month), unless unpaid.
  // Actually, let's keep only occurrences starting from the current calendar month
  // to avoid showing long-past overdue items if they weren't paid.
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const relevantCandidates = unpaidCandidates.filter((d) => d >= currentMonthStart);

  return relevantCandidates[0] || null;
});

// Virtual: is the bill paid for the current calendar month
billSchema.virtual('isPaid').get(function () {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();
  return this.lastPaidMonth === currentMonth && this.lastPaidYear === currentYear;
});

// Virtual: is this bill due in the current calendar month
billSchema.virtual('isDueThisMonth').get(function () {
  const nextDue = this.nextDueDate;
  if (!nextDue) return false;
  const now = new Date();
  return nextDue.getMonth() === now.getMonth() && nextDue.getFullYear() === now.getFullYear();
});

// Virtual: days until the next unpaid occurrence (can be negative if overdue!)
billSchema.virtual('daysUntilDue').get(function () {
  const nextDue = this.nextDueDate;
  if (!nextDue) return null;
  const now = new Date();
  const diffTime = nextDue.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

billSchema.set('toJSON', { virtuals: true });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;