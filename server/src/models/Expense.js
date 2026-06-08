import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type:     String,
      required: [true, 'Description is required'],
      trim:     true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type:     Number,
      required: [true, 'Amount is required'],
      min:      [1, 'Amount must be at least 1'],
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
        'Others',
      ],
      default: 'Others',
    },
    paymentMethod: {
      type:    String,
      enum:    ['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Cheque', 'Other'],
      default: 'Cash',
    },
    date: {
      type:    Date,
      default: Date.now,
    },
    approvalStatus: {
      type:    String,
      enum:    ['Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending',
    },
    eventId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: [true, 'Event is required'],
    },
    submittedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    approvedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    rejectionReason: {
      type:    String,
      default: '',
      trim:    true,
    },
    receiptUrl: {
      type:    String,
      default: '',
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

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;