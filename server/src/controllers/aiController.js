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

    // Fetch user's financial context
    let contextText = '';
    try {
      const [events, expenses, incomes, loans, goals, bills, investments] = await Promise.all([
        Event.find({ createdBy: req.user._id }).limit(10),
        Expense.find({ submittedBy: req.user._id }).populate('eventId', 'name').limit(20),
        Income.find({ userId: req.user._id }),
        Loan.find({ userId: req.user._id }),
        Goal.find({ userId: req.user._id }),
        Bill.find({ userId: req.user._id }),
        Investment.find({ userId: req.user._id }),
      ]);

      const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
      const totalSpent  = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);
      const pending     = expenses.filter((e) => e.approvalStatus === 'Pending').length;
      const overBudget  = events.filter((e) => e.spentAmount > e.totalBudget).length;

      // Incomes
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalIncome = incomes.reduce((s, i) => s + (i.amount || 0), 0);
      const monthlyIncome = incomes
        .filter((inc) => new Date(inc.date) >= startOfMonth)
        .reduce((s, inc) => s + (inc.amount || 0), 0);

      // Loans
      const totalLoans = loans.reduce((s, l) => s + (l.principal || 0), 0);
      const totalLoansPaid = loans.reduce((s, l) => s + (l.totalPaid || 0), 0);
      const totalLoansRemaining = loans.reduce((s, l) => {
        const totalPayable = l.principal + (l.principal * (l.interestRate / 100) * (l.tenureMonths / 12));
        return s + Math.max(0, totalPayable - (l.totalPaid || 0));
      }, 0);

      // Investments
      const totalInvested = investments.reduce((s, i) => s + (i.investedAmount || 0), 0);
      const totalCurrentValue = investments.reduce((s, i) => s + (i.currentValue || i.investedAmount || 0), 0);

      // Goals
      const totalGoalsTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
      const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);

      // Bills
      const unpaidBills = bills.filter((b) => {
        const isDueThisMonth = b.lastPaidMonth !== now.getMonth() + 1 || b.lastPaidYear !== now.getFullYear();
        return isDueThisMonth && !b.isPaid;
      });
      const totalUnpaidBillsAmt = unpaidBills.reduce((s, b) => s + (b.amount || 0), 0);

      // Net Worth Estimate
      const netWorth = totalCurrentValue + totalSaved - totalLoansRemaining;

      contextText = `
Current user: ${req.user.name} (${req.user.role})

=== FINANCIAL SUMMARY ===
Monthly Income (Current Month): ₹${monthlyIncome.toLocaleString('en-IN')}
Total Income: ₹${totalIncome.toLocaleString('en-IN')}

Events & Expenses:
- Total events: ${events.length}
- Total budget: ₹${totalBudget.toLocaleString('en-IN')}
- Total spent: ₹${totalSpent.toLocaleString('en-IN')}
- Budget utilization: ${totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%
- Pending approvals: ${pending}
- Events over budget: ${overBudget}

Loans:
- Total loans: ${loans.length}
- Total borrowed principal: ₹${totalLoans.toLocaleString('en-IN')}
- Total paid back: ₹${totalLoansPaid.toLocaleString('en-IN')}
- Outstanding debt remaining: ₹${totalLoansRemaining.toLocaleString('en-IN')}

Investments:
- Total investments: ${investments.length}
- Total amount invested: ₹${totalInvested.toLocaleString('en-IN')}
- Portfolio current value: ₹${totalCurrentValue.toLocaleString('en-IN')}

Goals:
- Total goals: ${goals.length}
- Total target: ₹${totalGoalsTarget.toLocaleString('en-IN')}
- Total saved: ₹${totalSaved.toLocaleString('en-IN')}

Bills:
- Total bills tracked: ${bills.length}
- Unpaid bills this month: ${unpaidBills.length} (Total due: ₹${totalUnpaidBillsAmt.toLocaleString('en-IN')})

Net Worth Estimate (Investments + Savings Goals - Outstanding Debt): ₹${netWorth.toLocaleString('en-IN')}

=== RECENT ACTIVITY ===
Recent events: ${events.slice(0, 3).map((e) =>
  `${e.name} (Budget: ₹${e.totalBudget}, Spent: ₹${e.spentAmount}, Status: ${e.status})`
).join(' | ')}
Recent expenses: ${expenses.slice(0, 3).map((e) =>
  `${e.description} ₹${e.amount} [${e.approvalStatus}]`
).join(' | ')}
Recent goals: ${goals.slice(0, 3).map((g) =>
  `${g.title} (Target: ₹${g.targetAmount}, Saved: ₹${g.currentAmount})`
).join(' | ')}
Recent investments: ${investments.slice(0, 3).map((i) =>
  `${i.name} (${i.type}, Invested: ₹${i.investedAmount}, Current: ₹${i.currentValue})`
).join(' | ')}
Recent bills: ${bills.slice(0, 3).map((b) =>
  `${b.title} (₹${b.amount}, Due day: ${b.dueDate}, Paid: ${b.isPaid})`
).join(' | ')}
      `.trim();
    } catch {
      contextText = `User: ${req.user.name} (${req.user.role})`;
    }

    // Build messages array
    const messages = [
      {
        role:    'system',
        content: `You are EventFi's AI financial assistant — a smart,
friendly advisor for event budget management and personal finance.

CONTEXT ABOUT THIS USER:
${contextText}

YOUR ROLE:
- Help with event budgeting, expense analysis, and personal finance decisions (incomes, loans, goals, bills, and investments)
- Give specific advice based on the user's actual numbers shown in the context above (always reference specific stats, incomes, goals, or debt numbers where relevant)
- Keep answers concise (2-4 sentences max unless asked for detail)
- Use ₹ for Indian Rupee amounts
- Be proactive: mention concerns like over-budget events, unpaid bills, high outstanding debt, or pending approvals
- You can help categorize expenses, suggest budget allocations, analyze spending

TONE: Encouraging, friendly, and professional. Speak like a knowledgeable finance colleague, not a robot.`,
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