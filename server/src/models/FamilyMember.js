import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    relation: {
      type: String,
      enum: ['Self', 'Spouse', 'Parent', 'Child', 'Sibling', 'Other'],
      default: 'Other',
    },
    monthlyIncome: {
      type:    Number,
      default: 0,
      min:     [0, 'Monthly income cannot be negative'],
    },
    color: {
      type:    String,
      default: '#004643',
    },
    avatar: {
      type:    String,
      default: '',
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
  },
  { timestamps: true }
);

const FamilyMember = mongoose.model('FamilyMember', familyMemberSchema);
export default FamilyMember;