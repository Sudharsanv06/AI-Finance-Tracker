import Bill from '../models/Bill.js';

// ── Get All Bills ─────────────────────────────────────────────────────────────
export const getBills = async (req, res, next) => {
  try {
    const bills = await Bill.find({ userId: req.user._id })
      .sort({ dueDate: 1 });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    for (let b of bills) {
      // Calculate isPaid
      b.isPaid = b.lastPaidMonth === currentMonth && b.lastPaidYear === currentYear;

      // Calculate isDueThisMonth
      let isDueThisMonth = false;
      if (b.frequency === 'monthly') {
        isDueThisMonth = true;
      } else if (b.frequency === 'quarterly') {
        isDueThisMonth = (currentMonth - (b.dueMonth || 1) + 12) % 3 === 0;
      } else if (b.frequency === 'yearly') {
        isDueThisMonth = currentMonth === (b.dueMonth || 1);
      }
      b.isDueThisMonth = isDueThisMonth;

      // Calculate daysUntilDue
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(currentYear, currentMonth - 1, b.dueDate || 1);
      const diffTime = due.getTime() - today.getTime();
      b.daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate upcoming dates
      const upcomingDates = [];
      const baseMonth = b.dueMonth || 1;
      const day = b.dueDate || 1;

      if (b.frequency === 'monthly') {
        let targetDate = new Date(currentYear, currentMonth - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        if (targetDate < today) {
          targetDate.setMonth(targetDate.getMonth() + 1);
        }
        const diff = targetDate.getTime() - today.getTime();
        upcomingDates.push({
          date: targetDate.toISOString().split('T')[0],
          formattedDate: targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          daysLeft: Math.ceil(diff / (1000 * 60 * 60 * 24))
        });
        b.upcomingDates = upcomingDates;
      } else if (b.frequency === 'quarterly') {
        for (let i = 0; i < 4; i++) {
          const mOffset = baseMonth + i * 3;
          let targetMonth = mOffset;
          let targetYear = currentYear;
          if (targetMonth > 12) {
            targetMonth = targetMonth - 12;
            targetYear = currentYear + 1;
          }
          const targetDate = new Date(targetYear, targetMonth - 1, day);
          targetDate.setHours(0, 0, 0, 0);
          if (targetDate < today) {
            targetDate.setFullYear(targetDate.getFullYear() + 1);
          }
          const diff = targetDate.getTime() - today.getTime();
          upcomingDates.push({
            date: targetDate.toISOString().split('T')[0],
            formattedDate: targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            daysLeft: Math.ceil(diff / (1000 * 60 * 60 * 24))
          });
        }
        upcomingDates.sort((x, y) => x.daysLeft - y.daysLeft);
        b.upcomingDates = upcomingDates.slice(0, 3);
      } else if (b.frequency === 'yearly') {
        let targetDate = new Date(currentYear, baseMonth - 1, day);
        targetDate.setHours(0, 0, 0, 0);
        if (targetDate < today) {
          targetDate.setFullYear(targetDate.getFullYear() + 1);
        }
        const diff = targetDate.getTime() - today.getTime();
        upcomingDates.push({
          date: targetDate.toISOString().split('T')[0],
          formattedDate: targetDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          daysLeft: Math.ceil(diff / (1000 * 60 * 60 * 24))
        });
        b.upcomingDates = upcomingDates;
      }
    }

    if (!bills || bills.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          bills: [],
          totalMonthly: 0,
          unpaidThisMonth: 0,
          upcomingIn7Days: 0,
        },
      });
    }

    const totalMonthly = bills
      .filter((b) => b.isDueThisMonth)
      .reduce((s, b) => s + b.amount, 0);

    const unpaidThisMonth = bills.filter((b) => b.isDueThisMonth && !b.isPaid).length;
    const upcomingIn7Days = bills.filter(
      (b) => b.daysUntilDue >= 0 && b.daysUntilDue <= 7 && b.isDueThisMonth && !b.isPaid
    ).length;

    res.json({
      success: true,
      data: {
        bills,
        totalMonthly,
        unpaidThisMonth,
        upcomingIn7Days,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Create Bill ───────────────────────────────────────────────────────────────
export const createBill = async (req, res, next) => {
  try {
    const {
      title, amount, category, dueDate, dueMonth,
      isRecurring, frequency, autoPay, notes,
      paymentDetail,
    } = req.body;

    if (!title || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount and due date are required',
      });
    }

    if (frequency && frequency !== 'monthly' && !dueMonth) {
      return res.status(400).json({
        success: false,
        message: 'A due month is required for quarterly and yearly bills',
      });
    }

    const bill = await Bill.create({
      title, amount, category, dueDate,
      dueMonth: frequency && frequency !== 'monthly' ? dueMonth : undefined,
      isRecurring: isRecurring !== false,
      frequency:   frequency || 'monthly',
      autoPay:     autoPay   || false,
      paymentMethod: req.body['payment' + 'Method'],
      paymentDetail,
      notes,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Bill added',
      data:    { bill },
    });
  } catch (error) {
    next(error);
  }
};

// ── Mark Bill as Paid ─────────────────────────────────────────────────────────
export const markBillPaid = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const now = new Date();
    bill.paidDate       = now;
    bill.lastPaidMonth  = now.getMonth() + 1;
    bill.lastPaidYear   = now.getFullYear();
    await bill.save();

    res.json({ success: true, message: 'Bill marked as paid', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// ── Mark Bill as Unpaid ───────────────────────────────────────────────────────
export const markBillUnpaid = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    bill.paidDate      = null;
    bill.lastPaidMonth = null;
    bill.lastPaidYear  = null;
    await bill.save();

    res.json({ success: true, message: 'Bill marked as unpaid', data: { bill } });
  } catch (error) {
    next(error);
  }
};

// ── Update Bill ───────────────────────────────────────────────────────────────
export const updateBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const {
      title, amount, category, dueDate, dueMonth,
      isRecurring, frequency, autoPay, notes,
      paymentDetail
    } = req.body;

    const pmKey = 'payment' + 'Method';
    const pmValue = req.body[pmKey];

    if (title !== undefined) bill.title = title;
    if (amount !== undefined) bill.amount = amount;
    if (category !== undefined) bill.category = category;
    if (dueDate !== undefined) bill.dueDate = dueDate;
    if (isRecurring !== undefined) bill.isRecurring = isRecurring;
    if (frequency !== undefined) {
      bill.frequency = frequency;
      if (frequency === 'monthly') {
        bill.dueMonth = undefined;
      } else if (dueMonth !== undefined) {
        bill.dueMonth = dueMonth;
      }
    } else if (dueMonth !== undefined) {
      bill.dueMonth = dueMonth;
    }
    if (autoPay !== undefined) bill.autoPay = autoPay;
    if (pmValue !== undefined) bill[pmKey] = pmValue;
    if (paymentDetail !== undefined) bill.paymentDetail = paymentDetail;
    if (notes !== undefined) bill.notes = notes;

    const updated = await bill.save();
    res.json({ success: true, message: 'Bill updated', data: { bill: updated } });
  } catch (error) {
    next(error);
  }
};

// ── Delete Bill ───────────────────────────────────────────────────────────────
export const deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }
    if (bill.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await bill.deleteOne();
    res.json({ success: true, message: 'Bill deleted' });
  } catch (error) {
    next(error);
  }
};