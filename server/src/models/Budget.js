import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        'Food & Dining', 'Transportation', 'Shopping',
        'Entertainment', 'Health', 'Education',
        'Utilities', 'Rent', 'Groceries',
        'Travel', 'Personal Care', 'Other', 'other', 'others', 'Others'
      ],
      required: [true, 'Category is required'],
    },
    monthlyLimit: {
      type:     Number,
      required: [true, 'Monthly limit is required'],
      min:      [1, 'Limit must be greater than 0'],
    },
    month: {
      type:     Number,
      required: true,
      min: 1, max: 12,
    },
    year: {
      type:     Number,
      required: true,
    },
    spent: {
      type:    Number,
      default: 0,
      min:     0,
    },
    alertAt: {
      type:    Number,
      default: 80,
      min:     1, max: 100,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual: utilization percent
budgetSchema.virtual('utilization').get(function () {
  if (!this.monthlyLimit) return 0;
  return Math.min(
    Math.round((this.spent / this.monthlyLimit) * 100), 100
  );
});

// Virtual: remaining
budgetSchema.virtual('remaining').get(function () {
  return Math.max(0, this.monthlyLimit - this.spent);
});

// Virtual: is over budget
budgetSchema.virtual('isOver').get(function () {
  return this.spent > this.monthlyLimit;
});

// Virtual: needs alert
budgetSchema.virtual('needsAlert').get(function () {
  return this.utilization >= this.alertAt;
});

budgetSchema.set('toJSON', { virtuals: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;