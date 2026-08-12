import Groq   from 'groq-sdk';
import Event   from '../models/Event.js';
import Expense from '../models/Expense.js';
import Income from '../models/Income.js';
import Loan from '../models/Loan.js';
import Goal from '../models/Goal.js';
import Bill from '../models/Bill.js';
import Investment from '../models/Investment.js';
import FamilyMember from '../models/FamilyMember.js';
import Budget from '../models/Budget.js';

const getGroq = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

// ── Chat ──────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
export const chat = async (req, res, next) => {
  try {
    const body    = req.body || {};
    const message = body.message || '';
    const history = body.history || [];

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    let contextText = '';
    try {
      // Always scope to the current user — no role-based leaking
      const userId = req.user._id;
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        events,
        expenses,
        incomes,
        loans,
        goals,
        bills,
        investments,
        familyMembers,
        allNonRejectedExpenses,
        budgets,
      ] = await Promise.all([
        Event.find({ createdBy: userId }).limit(10),
        Expense.find({ submittedBy: userId, approvalStatus: { $ne: 'Rejected' } })
          .sort({ date: -1 })
          .limit(15),
        Income.find({ userId }).sort({ date: -1 }).limit(20),
        Loan.find({ userId }),
        Goal.find({ userId }),
        Bill.find({ userId }),
        Investment.find({ userId }),
        FamilyMember.find({ userId }),
        Expense.find({ submittedBy: userId, approvalStatus: { $ne: 'Rejected' } }),
        Budget.find({ userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      ]);

      // Calculate expense aggregation facets in memory
      const categoriesMap = {};
      allNonRejectedExpenses.forEach(e => {
        const cat = e.category || 'Others';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + (e.amount || 0);
      });
      const byCategory = Object.entries(categoriesMap)
        .map(([cat, total]) => ({ _id: cat, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      const thisMonthSpent = allNonRejectedExpenses
        .filter(e => e.date && new Date(e.date) >= monthStart)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const allTimeSpent = allNonRejectedExpenses
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const expenseAgg = [{
        byCategory,
        thisMonth: [{ total: thisMonthSpent }],
        allTime: [{ total: allTimeSpent }]
      }];

      // ── Calculations ──
      const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
      const totalSpent = events.reduce((s, e) => s + (e.spentAmount || 0), 0);
      const pending = expenses.filter(e => e.approvalStatus === 'Pending').length;
      const overBudget = events.filter(e => e.spentAmount > e.totalBudget).length;

      const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
      const monthlyIncome = incomes
        .filter(i => new Date(i.date) >= monthStart)
        .reduce((s, i) => s + (i.amount || 0), 0);

      // Category Budgets Calculations
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const budgetDetails = budgets.map(b => {
        const spentSum = allNonRejectedExpenses
          .filter(e => {
            if (!e.date || e.category !== b.category) return false;
            const d = new Date(e.date);
            return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
          })
          .reduce((sum, e) => sum + (e.amount || 0), 0);

        const utilization = b.monthlyLimit > 0 ? Math.round((spentSum / b.monthlyLimit) * 100) : 0;
        const remaining = Math.max(0, b.monthlyLimit - spentSum);

        return {
          category: b.category,
          limit: b.monthlyLimit,
          spent: spentSum,
          remaining,
          utilization,
          isOver: spentSum > b.monthlyLimit
        };
      });

      const totalBudgetLimit = budgets.reduce((s, b) => s + (b.monthlyLimit || 0), 0);
      const totalBudgetSpent = budgetDetails.reduce((s, b) => s + b.spent, 0);

      // Loans Calculations
      const takenLoans = loans.filter(l => l.type === 'taken');
      const givenLoans = loans.filter(l => l.type === 'given');

      const totalLoanDebt = takenLoans.reduce((s, l) => {
        const totalPayable = l.principal + (l.principal * (l.interestRate / 100) * (l.tenureMonths / 12));
        return s + Math.max(0, totalPayable - (l.totalPaid || 0));
      }, 0);

      const totalLentRecoverable = givenLoans.reduce((s, l) => {
        const totalPayable = l.principal + (l.principal * (l.interestRate / 100) * (l.tenureMonths / 12));
        return s + Math.max(0, totalPayable - (l.totalPaid || 0));
      }, 0);

      const monthlyEMI = takenLoans
        .filter(l => (l.status || 'active') === 'active')
        .reduce((s, l) => s + (l.emiAmount || 0), 0);

      const monthlyEMIReceivable = givenLoans
        .filter(l => (l.status || 'active') === 'active')
        .reduce((s, l) => s + (l.emiAmount || 0), 0);

      const totalInvested = investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
      const portfolioValue = investments.reduce(
        (s, i) => s + (i.currentValue || i.investedAmount || 0), 0
      );
      const investmentReturns = portfolioValue - totalInvested;

      const activeGoals = goals.filter(g => g.status === 'active');
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const totalGoalTarget = activeGoals.reduce((s, g) => s + (g.targetAmount || 0), 0);
      const totalGoalSaved = activeGoals.reduce((s, g) => s + (g.currentAmount || 0), 0);

      const monthlyBills = bills
        .filter(b => b.frequency === 'monthly')
        .reduce((s, b) => s + (b.amount || 0), 0);

      const expCategoryTotals = expenseAgg[0]?.byCategory || [];
      const monthlyExpenseTotal = expenseAgg[0]?.thisMonth?.[0]?.total || 0;
      const allTimeExpenseTotal = expenseAgg[0]?.allTime?.[0]?.total || 0;

      const netWorth = portfolioValue + totalLentRecoverable - totalLoanDebt;
      const totalFamilyMonthlyIncome = incomes
        .filter(i => {
          if (!i.date) return false;
          const d = new Date(i.date);
          return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
        })
        .reduce((sum, i) => sum + (i.amount || 0), 0);
      const savingsRate = monthlyIncome > 0
        ? Math.round(
            ((monthlyIncome - monthlyEMI - monthlyBills - monthlyExpenseTotal) /
              monthlyIncome) * 100
          )
        : 0;

      // ── Build full bill list with details ──
      const billDetails = bills.map(b => {
        const dueInfo = [];
        dueInfo.push(`"${b.title}"`);
        dueInfo.push(`category: ${b.category}`);
        dueInfo.push(`amount: ₹${b.amount}`);
        dueInfo.push(`frequency: ${b.frequency}`);
        dueInfo.push(`due on day: ${b.dueDate}`);
        if (b.dueMonth) dueInfo.push(`due month: ${b.dueMonth}`);
        if (b.paymentMethod) dueInfo.push(`payment: ${b.paymentMethod}`);
        dueInfo.push(`status: ${b.isPaid ? 'Paid' : 'Unpaid'}`);
        if (b.isDueThisMonth !== undefined) {
          dueInfo.push(`due this month: ${b.isDueThisMonth ? 'Yes' : 'No'}`);
        }
        if (b.daysUntilDue !== undefined && b.daysUntilDue !== null) {
          dueInfo.push(`days until next due: ${b.daysUntilDue}`);
        }
        if (b.autoPay) dueInfo.push('auto-pay: enabled');
        if (b.notes) dueInfo.push(`notes: ${b.notes}`);
        return dueInfo.join(', ');
      }).join('\n  - ');

      // ── Build pending expense details ──
      const pendingExpenses = expenses
        .filter(e => e.approvalStatus === 'Pending')
        .map(e => `"${e.description}" - ₹${e.amount} (${e.category}, ${new Date(e.date).toLocaleDateString('en-IN')})`)
        .join('\n  - ');

      contextText = `
=== ${req.user.name}'s Complete Financial Snapshot ===
Role: ${req.user.role}
Data as of: ${now.toLocaleDateString('en-IN')}

INCOME
- Total income recorded: ₹${totalIncome.toLocaleString('en-IN')}
- This month income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Income sources: ${[...new Set(incomes.map(i => i.source))].join(', ') || 'None'}

PERSONAL EXPENSES
- This month spending: ₹${monthlyExpenseTotal.toLocaleString('en-IN')}
- All-time spending: ₹${allTimeExpenseTotal.toLocaleString('en-IN')}
- Top categories: ${expCategoryTotals.map(c =>
    `${c._id || 'Uncategorized'} (₹${(c.total||0).toLocaleString('en-IN')})`
  ).join(', ') || 'None'}
- Recent transactions: ${expenses.slice(0,8).map(e =>
    `"${e.description}" ₹${e.amount} (${e.category}, ${e.paymentMethod || 'N/A'}, ${new Date(e.date).toLocaleDateString('en-IN')})`
  ).join('; ') || 'None'}
- Pending approvals: ${pending}
${pendingExpenses ? `- Pending items:\n  - ${pendingExpenses}` : ''}

CATEGORY BUDGETS (Standard Category Limits for the current month)
- Total category limit: ₹${totalBudgetLimit.toLocaleString('en-IN')}
- Total category spent: ₹${totalBudgetSpent.toLocaleString('en-IN')}
- Category Budgets: ${budgetDetails.map(b => 
    `"${b.category}" (Spent: ₹${b.spent.toLocaleString('en-IN')}/Limit: ₹${b.limit.toLocaleString('en-IN')}, ${b.utilization}% used, ₹${b.remaining.toLocaleString('en-IN')} remaining${b.isOver ? ' - OVER BUDGET!' : ''})`
  ).join(', ') || 'None'}

EVENTS & EVENT BUDGETS (For special events/festivals)
- Total events: ${events.length} (${overBudget} over budget)
- Total event budget: ₹${totalBudget.toLocaleString('en-IN')}
- Total event spent: ₹${totalSpent.toLocaleString('en-IN')}
- Event budget used: ${totalBudget ? Math.round((totalSpent/totalBudget)*100) : 0}%
- Events: ${events.slice(0,5).map(e =>
    `"${e.name}" (₹${e.spentAmount||0}/₹${e.totalBudget||0}, ${Math.round((e.spentAmount/e.totalBudget)*100)||0}% used)`
  ).join(', ') || 'None'}

LOANS
- Total Debt (Still Owe taken loans): ₹${totalLoanDebt.toLocaleString('en-IN')}
- Total Lent (Yet to Recover given loans): ₹${totalLentRecoverable.toLocaleString('en-IN')}
- Monthly EMI to pay: ₹${monthlyEMI.toLocaleString('en-IN')}
- Monthly EMI to receive: ₹${monthlyEMIReceivable.toLocaleString('en-IN')}
- Active Taken Loans: ${takenLoans.filter(l => (l.status || 'active') === 'active').length}
- Active Given Loans: ${givenLoans.filter(l => (l.status || 'active') === 'active').length}
- Taken Loans Details: ${takenLoans.slice(0,5).map(l => {
    const totalPayable = l.principal + (l.principal * (l.interestRate / 100) * (l.tenureMonths / 12));
    const remaining = Math.max(0, totalPayable - (l.totalPaid || 0));
    return `"${l.title}" ₹${remaining.toLocaleString('en-IN')} remaining, EMI: ₹${l.emiAmount||0} (${l.status || 'active'})`;
  }).join(', ') || 'None'}
- Given Loans Details: ${givenLoans.slice(0,5).map(l => {
    const totalPayable = l.principal + (l.principal * (l.interestRate / 100) * (l.tenureMonths / 12));
    const remaining = Math.max(0, totalPayable - (l.totalPaid || 0));
    return `"${l.title}" ₹${remaining.toLocaleString('en-IN')} yet to recover, EMI: ₹${l.emiAmount||0} (${l.status || 'active'})`;
  }).join(', ') || 'None'}

INVESTMENTS
- Total invested: ₹${totalInvested.toLocaleString('en-IN')}
- Portfolio value: ₹${portfolioValue.toLocaleString('en-IN')}
- Returns: ₹${investmentReturns.toLocaleString('en-IN')} (${
    totalInvested > 0 ? ((investmentReturns/totalInvested)*100).toFixed(1) : 0
  }%)

GOALS
- Active: ${activeGoals.length}, Completed: ${completedGoals}
- Total target: ₹${totalGoalTarget.toLocaleString('en-IN')}
- Total saved: ₹${totalGoalSaved.toLocaleString('en-IN')}
- Details: ${activeGoals.slice(0,5).map(g => {
    const pct = g.targetAmount ? Math.min(Math.round(((g.currentAmount || 0) / g.targetAmount) * 100), 100) : 0;
    const remaining = Math.max((g.targetAmount || 0) - (g.currentAmount || 0), 0);
    return `"${g.title}" ${pct}% done, ₹${remaining.toLocaleString('en-IN')} left`;
  }).join(', ') || 'None'}

BILLS & REMINDERS (ALL bills, not just urgent ones)
- Total monthly bill obligations: ₹${monthlyBills.toLocaleString('en-IN')}
- Total bills tracked: ${bills.length}
${billDetails ? `- All bills:\n  - ${billDetails}` : '- No bills tracked yet'}

FAMILY MEMBERS
- Total family members: ${familyMembers.length}
- Total family monthly income: ₹${totalFamilyMonthlyIncome.toLocaleString('en-IN')}
- Members: ${familyMembers.map(m => {
    const rec = incomes
      .filter(i => {
        if (!i.date || i.familyMember !== m._id) return false;
        const d = new Date(i.date);
        return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
      })
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    return `"${m.name}" (${m.relation}, recorded this month: ₹${rec.toLocaleString('en-IN')})`;
  }).join(', ') || 'None'}

NET WORTH
- Assets: ₹${(portfolioValue + totalLentRecoverable).toLocaleString('en-IN')} (investments + money lent out)
- Liabilities: ₹${totalLoanDebt.toLocaleString('en-IN')} (money borrowed)
- Net worth: ₹${netWorth.toLocaleString('en-IN')}
- Savings rate: ${savingsRate}%
`.trim();

    } catch (contextError) {
      console.error('Context fetch error:', contextError);
      contextText = `User: ${req.user.name} (${req.user.role})
Note: Could not fetch complete financial data.`;
    }

    const messages = [
      {
        role: 'system',
        content: `You are Paisa Pulse AI — a personal financial advisor
for ${req.user.name}. You have their COMPLETE financial data below,
including every single bill reminder they've set up, their pending
expense approvals with full details, and their recent transactions.

${contextText}

YOUR BEHAVIOR:
- ALWAYS use their actual numbers and data. You have EVERYTHING above.
- When asked about bills, reminders, or "how many days left", look in
  the BILLS & REMINDERS section — every bill is listed with its title,
  amount, frequency, due date, due month, payment method, paid status,
  whether it's due this month, and exactly how many days until it's
  next due.
- When asked about pending approvals, look in the PERSONAL EXPENSES
  section — every pending item is listed with its description, amount,
  category, and date.
- Never say "I don't have access to your data" or "I couldn't find
  details" — you have it ALL above. If a section genuinely has no
  data, say "You haven't added any [X] yet" instead.
- Be specific: use bill titles, amounts, and dates from the data.
- Keep responses to 3-4 sentences MAX unless user asks for detail.
- Use ₹ for all amounts.
- Never make up numbers.`,
      },
      ...history.slice(-6).map((msg) => ({
        role:    msg.role,
        content: msg.content,
      })),
      {
        role:    'user',
        content: message,
      },
    ];

    const completion = await getGroq().chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages,
      max_tokens:  512,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    res.json({
      success: true,
      data:    { reply },
    });
  } catch (error) {
    next(error);
  }
};

// ── Categorize Expense ────────────────────────────────────────────────────────
// POST /api/ai/categorize
export const categorizeExpense = async (req, res, next) => {
  try {
    const body        = req.body || {};
    const description = body.description || '';
    const eventId     = body.eventId || null;

    if (!description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    const hasEvent = eventId && eventId !== 'null' && eventId !== 'undefined' && eventId !== '';

    const categoriesList = hasEvent
      ? ['Venue', 'Catering', 'Decoration', 'Entertainment', 'Marketing', 'Equipment', 'Staff', 'Transportation', 'Others']
      : ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Health', 'Education', 'Utilities', 'Rent', 'Groceries', 'Travel', 'Personal Care', 'Other'];

    const categoriesStr = categoriesList.join(', ');

    const systemPrompt = hasEvent
      ? `You are an expense categorizer for event management.
Given an expense description, respond with ONLY one category from this list:
${categoriesStr}

Rules:
- Respond with ONLY the category word, nothing else
- No explanation, no punctuation, just the category
- Examples: "Hall rental" → Venue, "Food and snacks" → Catering, "DJ booking" → Entertainment`
      : `You are an expense categorizer for personal finance tracking.
Given an expense description, respond with ONLY one category from this list:
${categoriesStr}

Rules:
- Respond with ONLY the category word, nothing else
- No explanation, no punctuation, just the category
- Examples: "Lunch at Restaurant" → Food & Dining, "Uber ride" → Transportation, "Rent payment" → Rent`;

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role:    'system',
          content: systemPrompt,
        },
        {
          role:    'user',
          content: description,
        },
      ],
      max_tokens:  10,
      temperature: 0.1,
    });

    const fallback = hasEvent ? 'Others' : 'Other';
    const raw   = completion.choices[0]?.message?.content?.trim() || fallback;
    const category = categoriesList.includes(raw) ? raw : fallback;

    res.json({
      success: true,
      data:    { category },
    });
  } catch (error) {
    next(error);
  }
};