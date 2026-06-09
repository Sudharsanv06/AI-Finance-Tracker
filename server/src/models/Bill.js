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

// Virtual: is due this month
billSchema.virtual('isDueThisMonth').get(function () {
  const now = new Date();
  return (
    this.lastPaidMonth !== now.getMonth() + 1 ||
    this.lastPaidYear  !== now.getFullYear()
  );
});

// Virtual: days until due
billSchema.virtual('daysUntilDue').get(function () {
  const now  = new Date();
  const due  = new Date(
    now.getFullYear(),
    now.getMonth(),
    this.dueDate
  );
  if (due < now) due.setMonth(due.getMonth() + 1);
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  return diff;
});

billSchema.set('toJSON', { virtuals: true });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;