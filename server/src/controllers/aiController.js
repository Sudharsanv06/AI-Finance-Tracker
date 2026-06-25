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
      // Fetch ALL user data in parallel
      let eventQuery = { createdBy: req.user._id };
      
      const userId = req.user._id;
      const now = new Date();
      const monthStart = new Date(
        now.getFullYear(), now.getMonth(), 1
      );

      const [
        events,
        expenses,
        incomes,
        loans,
        goals,
        bills,
        investments,
      ] = await Promise.all([
        Event.find(eventQuery).limit(10),
        Expense.find(
          req.user.role === 'Organizer'
            ? { submittedBy: userId }
            : {}
        ).limit(20),
        Income.find({ userId }).sort({ date: -1 }).limit(20),
        Loan.find({ userId }),
        Goal.find({ userId }),
        Bill.find({ userId }),
        Investment.find({ userId }),
      ]);

      // Calculate all metrics
      const totalBudget = events.reduce(
        (s, e) => s + (e.totalBudget || 0), 0
      );
      const totalSpent = events.reduce(
        (s, e) => s + (e.spentAmount || 0), 0
      );
      const pending = expenses.filter(
        e => e.approvalStatus === 'Pending'
      ).length;
      const overBudget = events.filter(
        e => e.spentAmount > e.totalBudget
      ).length;

      const totalIncome = incomes.reduce(
        (s, i) => s + (i.amount || 0), 0
      );
      const monthlyIncome = incomes
        .filter(i => new Date(i.date) >= monthStart)
        .reduce((s, i) => s + (i.amount || 0), 0);

      const takenLoans = loans.filter(l => l.type === 'taken');
      const totalLoanDebt = takenLoans.reduce(
        (s, l) => s + (l.remainingAmount || 0), 0
      );
      const monthlyEMI = takenLoans
        .filter(l => l.status === 'active')
        .reduce((s, l) => s + (l.emiAmount || 0), 0);

      const totalInvested = investments.reduce(
        (s, i) => s + (i.investedAmount || 0), 0
      );
      const portfolioValue = investments.reduce(
        (s, i) => s + (i.currentValue || i.investedAmount || 0), 0
      );
      const investmentReturns = portfolioValue - totalInvested;

      const activeGoals = goals.filter(g => g.status === 'active');
      const completedGoals = goals.filter(
        g => g.status === 'completed'
      ).length;
      const totalGoalTarget = activeGoals.reduce(
        (s, g) => s + (g.targetAmount || 0), 0
      );
      const totalGoalSaved = activeGoals.reduce(
        (s, g) => s + (g.currentAmount || 0), 0
      );

      const unpaidBills = bills.filter(
        b => b.isDueThisMonth && !b.isPaid
      );
      const monthlyBills = bills
        .filter(b => b.frequency === 'monthly')
        .reduce((s, b) => s + (b.amount || 0), 0);

      const netWorth = portfolioValue - totalLoanDebt;
      const savingsRate = monthlyIncome > 0
        ? Math.round(
            ((monthlyIncome - monthlyEMI - monthlyBills) /
              monthlyIncome) * 100
          )
        : 0;

      contextText = `
=== ${req.user.name}'s Complete Financial Snapshot ===
Role: ${req.user.role}
Data as of: ${now.toLocaleDateString('en-IN')}

💰 INCOME
- Total income recorded: ₹${totalIncome.toLocaleString('en-IN')}
- This month income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Income sources: ${[...new Set(incomes.map(i => i.source))].join(', ') || 'None'}

📅 EVENTS & EXPENSES  
- Total events: ${events.length} (${overBudget} over budget)
- Total budget: ₹${totalBudget.toLocaleString('en-IN')}
- Total spent: ₹${totalSpent.toLocaleString('en-IN')}
- Budget used: ${totalBudget ? Math.round((totalSpent/totalBudget)*100) : 0}%
- Pending approvals: ${pending}
- Recent events: ${events.slice(0,3).map(e =>
    `${e.name}(${Math.round((e.spentAmount/e.totalBudget)*100)||0}% used)`
  ).join(', ') || 'None'}

🤝 LOANS
- Total debt outstanding: ₹${totalLoanDebt.toLocaleString('en-IN')}
- Monthly EMI burden: ₹${monthlyEMI.toLocaleString('en-IN')}
- Active loans: ${takenLoans.filter(l=>l.status==='active').length}
- Loans: ${takenLoans.slice(0,3).map(l =>
    `${l.title}(₹${(l.remainingAmount||0).toLocaleString('en-IN')} left)`
  ).join(', ') || 'None'}

📈 INVESTMENTS
- Total invested: ₹${totalInvested.toLocaleString('en-IN')}
- Current portfolio value: ₹${portfolioValue.toLocaleString('en-IN')}
- Total returns: ₹${investmentReturns.toLocaleString('en-IN')} (${
    totalInvested > 0
      ? ((investmentReturns/totalInvested)*100).toFixed(1)
      : 0
  }%)

🎯 GOALS
- Active goals: ${activeGoals.length}
- Completed goals: ${completedGoals}
- Total target: ₹${totalGoalTarget.toLocaleString('en-IN')}
- Total saved: ₹${totalGoalSaved.toLocaleString('en-IN')}
- Goals: ${activeGoals.slice(0,3).map(g =>
    `${g.title}(${g.progressPercent||0}% done, ₹${
      (g.remainingAmount||0).toLocaleString('en-IN')
    } left)`
  ).join(', ') || 'None'}

💳 BILLS
- Monthly bill obligations: ₹${monthlyBills.toLocaleString('en-IN')}
- Unpaid this month: ${unpaidBills.length}
- Urgent bills: ${unpaidBills.slice(0,3).map(b =>
    `${b.title}(₹${b.amount} due ${b.dueDate}th)`
  ).join(', ') || 'None'}

📊 NET WORTH SUMMARY
- Assets (investments): ₹${portfolioValue.toLocaleString('en-IN')}
- Liabilities (loans): ₹${totalLoanDebt.toLocaleString('en-IN')}
- Estimated net worth: ₹${netWorth.toLocaleString('en-IN')}
- Savings rate: ${savingsRate}%
`.trim();

    } catch (contextError) {
      console.error('Context fetch error:', contextError);
      contextText = `User: ${req.user.name} (${req.user.role})
Note: Could not fetch complete financial data.`;
    }

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: `You are Paisa Pulse AI — a personal financial advisor 
for ${req.user.name}. You have their complete financial data below.

${contextText}

YOUR BEHAVIOR:
- ALWAYS use their actual numbers. Never say "I don't have access 
  to your data" — you have it all above.
- When asked general questions like "how am I doing" or 
  "give me a summary", analyze ALL sections above and give 
  a complete picture
- Point out concerns: over-budget events, high EMI-to-income 
  ratio, unpaid bills, slow goal progress
- Be encouraging but honest
- Keep responses to 3-4 sentences MAX unless user asks for detail
- Use ₹ for all Indian currency amounts
- If a section has no data (None), acknowledge it and suggest 
  they start tracking that category
- Never make up numbers — only use what's in the context above`,
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