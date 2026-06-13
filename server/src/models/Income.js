import mongoose from 'mongoose';

const incomeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Income source is required'],
    },
    amount: {
      type:     Number,
      required: [true, 'Amount is required'],
      min:      [1, 'Amount must be greater than 0'],
    },
    date: {
      type:    Date,
      default: Date.now,
    },
    description: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    isRecurring: {
      type:    Boolean,
      default: false,
    },
    frequency: {
      type:    String,
      enum:    ['monthly', 'weekly', 'yearly', 'one-time'],
      default: 'one-time',
    },
    familyMember: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'FamilyMember',
      default: null,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    notes: {
      type:    String,
      default: '',
      trim:    true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
    },
  },
  { timestamps: true }
);

const Income = mongoose.model('Income', incomeSchema);
export default Income;