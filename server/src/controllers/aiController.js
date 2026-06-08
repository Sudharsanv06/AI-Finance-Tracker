import Groq   from 'groq-sdk';
import Event   from '../models/Event.js';
import Expense from '../models/Expense.js';

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
      let eventQuery = {};
      if (req.user.role === 'Organizer') {
        eventQuery.createdBy = req.user._id;
      }
      const events   = await Event.find(eventQuery).limit(10);
      const expenses = await Expense.find(
        req.user.role === 'Organizer'
          ? { submittedBy: req.user._id }
          : {}
      )
        .populate('eventId', 'name')
        .limit(20);

      const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
      const totalSpent  = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);
      const pending     = expenses.filter((e) => e.approvalStatus === 'Pending').length;
      const overBudget  = events.filter((e) => e.spentAmount > e.totalBudget).length;

      contextText = `
Current user: ${req.user.name} (${req.user.role})
Total events: ${events.length}
Total budget across events: ₹${totalBudget.toLocaleString('en-IN')}
Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Budget utilization: ${totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0}%
Pending approvals: ${pending}
Events over budget: ${overBudget}
Recent events: ${events.slice(0, 5).map((e) =>
  `${e.name} (Budget: ₹${e.totalBudget}, Spent: ₹${e.spentAmount}, Status: ${e.status})`
).join(' | ')}
Recent expenses: ${expenses.slice(0, 5).map((e) =>
  `${e.description} ₹${e.amount} [${e.approvalStatus}]`
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
friendly advisor for event budget management.

CONTEXT ABOUT THIS USER:
${contextText}

YOUR ROLE:
- Help with event budgeting, expense analysis, and financial decisions
- Give specific advice based on the user's actual data shown above
- Keep answers concise (2-4 sentences max unless asked for detail)
- Use ₹ for Indian Rupee amounts
- Be proactive: mention concerns like over-budget events or pending approvals
- You can help categorize expenses, suggest budget allocations, analyze spending

TONE: Professional but friendly. No bullet point overload. Speak like a
knowledgeable finance colleague, not a robot.`,
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