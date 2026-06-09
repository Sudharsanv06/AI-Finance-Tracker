import mongoose from 'mongoose';

const emiPaymentSchema = new mongoose.Schema({
  amount:    { type: Number, required: true },
  date:      { type: Date,   default: Date.now },
  note:      { type: String, default: '' },
  isPaid:    { type: Boolean, default: true },
});

const loanSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Loan title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['taken', 'given'],
      required: [true, 'Loan type is required'],
    },
    loanFrom: {
      type:    String,
      trim:    true,
      default: '',
    },
    loanTo: {
      type:    String,
      trim:    true,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Home Loan',
        'Car Loan',
        'Personal Loan',
        'Education Loan',
        'Business Loan',
        'Gold Loan',
        'Friend/Family',
        'Other',
      ],
      default: 'Personal Loan',
    },
    principal: {
      type:     Number,
      required: [true, 'Principal amount is required'],
      min:      [1, 'Amount must be greater than 0'],
    },
    interestRate: {
      type:    Number,
      default: 0,
      min:     [0, 'Interest rate cannot be negative'],
    },
    tenureMonths: {
      type:    Number,
      default: 12,
      min:     [1, 'Tenure must be at least 1 month'],
    },
    emiAmount: {
      type:    Number,
      default: 0,
    },
    startDate: {
      type:    Date,
      default: Date.now,
    },
    endDate: {
      type:    Date,
      default: null,
    },
    totalPaid: {
      type:    Number,
      default: 0,
    },
    status: {
      type:    String,
      enum:    ['active', 'completed', 'defaulted'],
      default: 'active',
    },
    payments: [emiPaymentSchema],
    notes: {
      type:    String,
      default: '',
      trim:    true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual: remaining amount
loanSchema.virtual('remainingAmount').get(function () {
  const totalPayable = this.principal +
    (this.principal * (this.interestRate / 100) * (this.tenureMonths / 12));
  return Math.max(0, totalPayable - (this.totalPaid || 0));
});

// Virtual: paid EMIs count
loanSchema.virtual('paidEMIs').get(function () {
  return this.payments?.length || 0;
});

// Virtual: progress percent
loanSchema.virtual('progressPercent').get(function () {
  const totalPayable = this.principal +
    (this.principal * (this.interestRate / 100) * (this.tenureMonths / 12));
  if (!totalPayable) return 0;
  return Math.min(
    Math.round(((this.totalPaid || 0) / totalPayable) * 100),
    100
  );
});

loanSchema.set('toJSON', { virtuals: true });

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;