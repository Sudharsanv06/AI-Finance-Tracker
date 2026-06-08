import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Event name is required'],
      trim:     true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    date: {
      type: Date,
    },
    category: {
      type: String,
      enum: [
        'Venue',
        'Catering',
        'Decoration',
        'Entertainment',
        'Marketing',
        'Equipment',
        'Staff',
        'Transportation',
        'Conference',
        'Wedding',
        'Corporate',
        'Others',
      ],
      default: 'Others',
    },
    totalBudget: {
      type:    Number,
      required: [true, 'Budget is required'],
      min:     [0, 'Budget cannot be negative'],
    },
    spentAmount: {
      type:    Number,
      default: 0,
      min:     [0, 'Spent amount cannot be negative'],
    },
    status: {
      type:    String,
      enum:    ['active', 'upcoming', 'completed', 'draft', 'cancelled'],
      default: 'active',
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Virtual: budget utilization percentage
eventSchema.virtual('utilization').get(function () {
  if (!this.totalBudget) return 0;
  return Math.round((this.spentAmount / this.totalBudget) * 100);
});

// Virtual: remaining budget
eventSchema.virtual('remaining').get(function () {
  return this.totalBudget - this.spentAmount;
});

eventSchema.set('toJSON', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;