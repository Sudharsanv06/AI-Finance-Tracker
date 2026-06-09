import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Investment name is required'],
      trim:      true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: ['SIP','FD','Stocks','Gold','PPF','NPS',
             'Mutual Fund','Real Estate','Crypto','Other'],
      required: [true, 'Investment type is required'],
    },
    platform: {
      type:    String,
      trim:    true,
      default: '',
    },
    investedAmount: {
      type:     Number,
      required: [true, 'Invested amount is required'],
      min:      [1, 'Amount must be greater than 0'],
    },
    currentValue: {
      type:    Number,
      default: 0,
      min:     [0, 'Current value cannot be negative'],
    },
    startDate: {
      type:    Date,
      default: Date.now,
    },
    maturityDate: {
      type:    Date,
      default: null,
    },
    interestRate: {
      type:    Number,
      default: 0,
      min:     [0, 'Interest rate cannot be negative'],
    },
    monthlyContribution: {
      type:    Number,
      default: 0,
    },
    status: {
      type:    String,
      enum:    ['active', 'matured', 'withdrawn'],
      default: 'active',
    },
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

// Virtual: returns amount
investmentSchema.virtual('returnsAmount').get(function () {
  return (this.currentValue || 0) - (this.investedAmount || 0);
});

// Virtual: returns percentage
investmentSchema.virtual('returnsPercent').get(function () {
  if (!this.investedAmount) return 0;
  return (
    (((this.currentValue || 0) - this.investedAmount) /
      this.investedAmount) *
    100
  ).toFixed(2);
});

investmentSchema.set('toJSON', { virtuals: true });

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;