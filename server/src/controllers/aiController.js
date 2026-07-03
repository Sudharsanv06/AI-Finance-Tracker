import Groq   from 'groq-sdk';
import Event   from '../models/Event.js';
import Expense from '../models/Expense.js';
import Income from '../models/Income.js';
import Loan from '../models/Loan.js';
import Goal from '../models/Goal.js';
import Bill from '../models/Bill.js';
import Investment from '../models/Investment.js';

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
        expenseAgg,
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
        Expense.aggregate([
          { $match: { submittedBy: userId, approvalStatus: { $ne: 'Rejected' } } },
          {
            $facet: {
              byCategory: [
                { $group: { _id: '$category', total: { $sum: '$amount' } } },
                { $sort: { total: -1 } },
                { $limit: 8 },
              ],
              thisMonth: [
                { $match: { date: { $gte: monthStart } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
              ],
              allTime: [
                { $group: { _id: null, total: { $sum: '$amount' } } },
              ],
            },
          },
        ]),
      ]);

      // ── Calculations ──
      const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
      const totalSpent = events.reduce((s, e) => s + (e.spentAmount || 0), 0);
      const pending = expenses.filter(e => e.approvalStatus === 'Pending').length;
      const overBudget = events.filter(e => e.spentAmount > e.totalBudget).length;

      const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
      const monthlyIncome = incomes
        .filter(i => new Date(i.date) >= monthStart)
        .reduce((s, i) => s + (i.amount || 0), 0);

      const takenLoans = loans.filter(l => l.type === 'taken');
      const totalLoanDebt = takenLoans.reduce((s, l) => s + (l.remainingAmount || 0), 0);
      const monthlyEMI = takenLoans
        .filter(l => l.status === 'active')
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

      const netWorth = portfolioValue - totalLoanDebt;
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

EVENTS & EVENT BUDGETS
- Total events: ${events.length} (${overBudget} over budget)
- Total budget: ₹${totalBudget.toLocaleString('en-IN')}
- Total spent: ₹${totalSpent.toLocaleString('en-IN')}
- Budget used: ${totalBudget ? Math.round((totalSpent/totalBudget)*100) : 0}%
- Events: ${events.slice(0,5).map(e =>
    `"${e.name}" (₹${e.spentAmount||0}/₹${e.totalBudget||0}, ${Math.round((e.spentAmount/e.totalBudget)*100)||0}% used)`
  ).join(', ') || 'None'}

LOANS
- Total debt: ₹${totalLoanDebt.toLocaleString('en-IN')}
- Monthly EMI: ₹${monthlyEMI.toLocaleString('en-IN')}
- Active loans: ${takenLoans.filter(l=>l.status==='active').length}
- Details: ${takenLoans.slice(0,5).map(l =>
    `"${l.title}" ₹${(l.remainingAmount||0).toLocaleString('en-IN')} remaining, EMI ₹${l.emiAmount||0}`
  ).join(', ') || 'None'}

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
- Details: ${activeGoals.slice(0,5).map(g =>
    `"${g.title}" ${g.progressPercent||0}% done, ₹${(g.remainingAmount||0).toLocaleString('en-IN')} left`
  ).join(', ') || 'None'}

BILLS & REMINDERS (ALL bills, not just urgent ones)
- Total monthly bill obligations: ₹${monthlyBills.toLocaleString('en-IN')}
- Total bills tracked: ${bills.length}
${billDetails ? `- All bills:\n  - ${billDetails}` : '- No bills tracked yet'}

NET WORTH
- Assets: ₹${portfolioValue.toLocaleString('en-IN')}
- Liabilities: ₹${totalLoanDebt.toLocaleString('en-IN')}
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

    if (!description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role:    'system',
          content: `You are an expense categorizer for event management.
Given an expense description, respond with ONLY one category from this list:
Venue, Catering, Decoration, Entertainment, Marketing, Equipment, Staff, Transportation, Others

Rules:
- Respond with ONLY the category word, nothing else
- No explanation, no punctuation, just the category
- Examples: "Hall rental" → Venue, "Food and snacks" → Catering, "DJ booking" → Entertainment`,
        },
        {
          role:    'user',
          content: description,
        },
      ],
      max_tokens:  10,
      temperature: 0.1,
    });

    const raw   = completion.choices[0]?.message?.content?.trim() || 'Others';
    const valid = [
      'Venue','Catering','Decoration','Entertainment',
      'Marketing','Equipment','Staff','Transportation','Others',
    ];
    const category = valid.includes(raw) ? raw : 'Others';

    res.json({
      success: true,
      data:    { category },
    });
  } catch (error) {
    next(error);
  }
};