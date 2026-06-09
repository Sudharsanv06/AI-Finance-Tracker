import FamilyMember from '../models/FamilyMember.js';
import Income       from '../models/Income.js';

// ── Get All Family Members ────────────────────────────────────────────────────
export const getFamilyMembers = async (req, res, next) => {
  try {
    const members = await FamilyMember.find({ userId: req.user._id })
      .sort({ createdAt: 1 });

    // Attach income stats to each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const now        = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyIncome = await Income.find({
          userId:       req.user._id,
          familyMember: member._id,
          date:         { $gte: monthStart },
        });

        const totalIncome = await Income.find({
          userId:       req.user._id,
          familyMember: member._id,
        });

        return {
          ...member.toJSON(),
          // monthlyIncome stays from model (manually entered value)
          recordedIncome: monthlyIncome.reduce((s, i) => s + i.amount, 0),
          totalIncome:    totalIncome.reduce((s, i)   => s + i.amount, 0),
        };
      })
    );

    res.json({
      success: true,
      count:   members.length,
      data:    { members: membersWithStats },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Family Member ──────────────────────────────────────────────────────
export const createFamilyMember = async (req, res, next) => {
  try {
    const { name, relation, monthlyIncome, color } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false, message: 'Name is required',
      });
    }

    const member = await FamilyMember.create({
      name: name.trim(),
      relation:      relation      || 'Other',
      monthlyIncome: monthlyIncome || 0,
      color:         color         || '#004643',
      userId:        req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Family member added',
      data:    { member },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Family Member ──────────────────────────────────────────────────────
export const updateFamilyMember = async (req, res, next) => {
  try {
    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false, message: 'Member not found',
      });
    }
    if (member.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }

    const updated = await FamilyMember.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );

    res.json({
      success: true,
      message: 'Member updated',
      data:    { member: updated },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Family Member ──────────────────────────────────────────────────────
export const deleteFamilyMember = async (req, res, next) => {
  try {
    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false, message: 'Member not found',
      });
    }
    if (member.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false, message: 'Not authorized',
      });
    }
    await member.deleteOne();
    res.json({ success: true, message: 'Member deleted' });
  } catch (error) {
    next(error);
  }
};