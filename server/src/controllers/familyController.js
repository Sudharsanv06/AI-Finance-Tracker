import FamilyMember from '../models/FamilyMember.js';
import Income       from '../models/Income.js';

// ── Get All Family Members ────────────────────────────────────────────────────
export const getFamilyMembers = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    let members = await FamilyMember.find({ userId: req.user._id, archived: { $ne: true } })
      .sort({ createdAt: 1 });

    // Auto-create Self member if not exists
    let selfMember = members.find((m) => m.relation === 'Self');
    if (!selfMember) {
      selfMember = await FamilyMember.create({
        name:          req.user.name || 'Self',
        relation:      'Self',
        monthlyIncome: 0,
        color:         '#004643',
        userId:        req.user._id,
      });
      // Re-fetch list to include the new member
      members = await FamilyMember.find({ userId: req.user._id })
        .sort({ createdAt: 1 });
    }

    // Attach income stats to each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd   = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        let monthlyIncome = [];
        let totalIncome = [];

        if (member.relation === 'Self') {
          // If relation is Self, aggregate income assigned to this familyMember ID OR unassigned (null)
          const [resMonthlyAssigned, resMonthlyUnassigned] = await Promise.all([
            Income.find({ userId: req.user._id, familyMember: member._id, date: { $gte: monthStart, $lte: monthEnd } }),
            Income.find({ userId: req.user._id, familyMember: null, date: { $gte: monthStart, $lte: monthEnd } }),
          ]);
          monthlyIncome = [...resMonthlyAssigned, ...resMonthlyUnassigned];

          const [resTotalAssigned, resTotalUnassigned] = await Promise.all([
            Income.find({ userId: req.user._id, familyMember: member._id }),
            Income.find({ userId: req.user._id, familyMember: null }),
          ]);
          totalIncome = [...resTotalAssigned, ...resTotalUnassigned];
        } else {
          monthlyIncome = await Income.find({
            userId:       req.user._id,
            familyMember: member._id,
            date:         { $gte: monthStart, $lte: monthEnd },
          });
          totalIncome = await Income.find({
            userId:       req.user._id,
            familyMember: member._id,
          });
        }

        return {
          ...member.toJSON(),
          recordedIncome: monthlyIncome.reduce((s, i) => s + (i.amount || 0), 0),
          totalIncome:    totalIncome.reduce((s, i)   => s + (i.amount || 0), 0),
          incomes:        monthlyIncome.map(i => ({
            _id: i._id,
            id: i.id,
            source: i.source,
            amount: i.amount,
            date: i.date,
            description: i.description,
            notes: i.notes,
            isRecurring: i.isRecurring,
            frequency: i.frequency,
          })).sort((a, b) => new Date(b.date) - new Date(a.date)),
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
    const { name, relation, monthlyIncome, color, date } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false, message: 'Name is required',
      });
    }

    const recordDate = date || new Date().toISOString().split('T')[0];

    const member = await FamilyMember.create({
      name: name.trim(),
      relation:      relation      || 'Other',
      monthlyIncome: 0,
      color:         color         || '#004643',
      date:          recordDate,
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
    if (member.relation === 'Self') {
      return res.status(400).json({
        success: false, message: 'Cannot delete the Self member',
      });
    }

    // Soft-delete: mark as archived
    await FamilyMember.findByIdAndUpdate(member.id, { archived: true, archivedAt: new Date() });

    // Deactivate any recurring templates tied to this member
    const templates = await Income.find({
      userId: req.user._id,
      familyMember: member.id,
      isTemplate: true,
      active: true,
    });

    for (const t of templates) {
      await Income.findByIdAndUpdate(t.id, { active: false, deactivatedReason: 'family_member_archived' });
    }

    res.json({
      success: true,
      message: 'Member archived successfully',
      data: {
        templatesDeactivated: templates.length,
      }
    });
  } catch (error) {
    next(error);
  }
};

// ── Get Delete Impact ─────────────────────────────────────────────────────────
export const getDeleteImpact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await FamilyMember.findById(id);
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

    // Find all income records associated with this family member
    const incomes = await Income.find({
      userId: req.user._id,
      familyMember: id,
    });

    const activeTemplates = incomes.filter(
      d => d.isTemplate && d.active
    );

    const totalAmount = incomes.reduce((sum, d) => sum + (d.amount || 0), 0);

    res.json({
      success: true,
      data: {
        incomeCount: incomes.length,
        totalAmount,
        activeRecurringCount: activeTemplates.length,
      }
    });
  } catch (error) {
    next(error);
  }
};