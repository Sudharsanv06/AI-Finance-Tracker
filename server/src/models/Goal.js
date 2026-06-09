import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Goal title is required'],
      trim:      true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: [
        'Emergency Fund', 'Vacation', 'Home Purchase',
        'Car Purchase', 'Education', 'Wedding',
        'Retirement', 'Business', 'Other',
      ],
      default: 'Other',
    },
    targetAmount: {
      type:     Number,
      required: [true, 'Target amount is required'],
      min:      [1, 'Target must be greater than 0'],
    },
    currentAmount: {
      type:    Number,
      default: 0,
      min:     0,
    },
    monthlyContribution: {
      type:    Number,
      default: 0,
      min:     0,
    },
    deadline: {
      type:    Date,
      default: null,
    },
    status: {
      type:    String,
      enum:    ['active', 'completed', 'paused'],
      default: 'active',
    },
    icon: {
      type:    String,
      default: '🎯',
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

// Virtual: progress percent
goalSchema.virtual('progressPercent').get(function () {
  if (!this.targetAmount) return 0;
  return Math.min(
    Math.round((this.currentAmount / this.targetAmount) * 100), 100
  );
});

// Virtual: remaining amount
goalSchema.virtual('remainingAmount').get(function () {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Virtual: months to goal
goalSchema.virtual('monthsToGoal').get(function () {
  if (!this.monthlyContribution || this.monthlyContribution <= 0) return null;
  const remaining = this.targetAmount - this.currentAmount;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / this.monthlyContribution);
});

goalSchema.set('toJSON', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;