# 📋 AI Finance Tracker — Project Overview

> Auto-generated on: 2026-06-09 14:23:07

---

## 🗂️ Directory Tree

```
ai-finance-tracker/
├── README.md
├── client/
│   ├── index.html
│   ├── vercel.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── package.json
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── assets/
│       │   └── hero.png
│       ├── components/
│       │   ├── ApprovalActions.jsx
│       │   ├── BudgetRing.jsx
│       │   ├── ChatBot.jsx
│       │   ├── ConfirmModal.jsx
│       │   ├── EmptyState.jsx
│       │   ├── EventCard.jsx
│       │   ├── EventForm.jsx
│       │   ├── ExpenseForm.jsx
│       │   ├── ExpenseTable.jsx
│       │   ├── Navbar.jsx
│       │   ├── Pagination.jsx
│       │   ├── ProtectedRoute.jsx
│       │   └── StatCard.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Events.jsx
│       │   ├── Expenses.jsx
│       │   ├── Login.jsx
│       │   ├── NotFound.jsx
│       │   ├── Profile.jsx
│       │   └── Register.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── eventService.js
│       │   └── expenseService.js
│       ├── styles/
│       │   └── globals.css
│       └── utils/
│           └── helpers.js
└── server/
    ├── package.json
    └── src/
        ├── index.js
        ├── config/
        │   └── db.js
        ├── controllers/
        │   ├── aiController.js
        │   ├── authController.js
        │   ├── eventController.js
        │   └── expenseController.js
        ├── middleware/
        │   ├── authMiddleware.js
        │   └── errorHandler.js
        ├── models/
        │   ├── Event.js
        │   ├── Expense.js
        │   └── User.js
        └── routes/
            ├── aiRoutes.js
            ├── authRoutes.js
            ├── eventRoutes.js
            └── expenseRoutes.js
```

---

## 📊 File Statistics

| Metric | Count |
|--------|-------|
| Total Files | 62 |
| JS / JSX Files | 47 |
| Lines of Code (JS/JSX) | 4664 |
| CSS Files | 3 |
| Config Files | 7 |

---

## 🖥️ Client — React + Vite Frontend

### Components (client/src/components/)

| File | Purpose |
|------|---------|
| ApprovalActions.jsx | Approve / reject action buttons for expense requests |
| BudgetRing.jsx | Circular donut chart showing budget usage |
| ChatBot.jsx | AI chat interface powered by Claude API |
| ConfirmModal.jsx | Reusable confirmation dialog |
| EmptyState.jsx | Empty list placeholder UI |
| EventCard.jsx | Card display for a single event |
| EventForm.jsx | Create / edit event form |
| ExpenseForm.jsx | Create / edit expense form |
| ExpenseTable.jsx | Paginated sortable expense list table |
| Navbar.jsx | Top navigation bar with auth links |
| Pagination.jsx | Page navigation controls |
| ProtectedRoute.jsx | Auth guard wrapper for private routes |
| StatCard.jsx | Summary stat card (total spend, budget, etc.) |

### Pages (client/src/pages/)

| File | Route | Description |
|------|-------|-------------|
| Dashboard.jsx | /dashboard | Overview stats, charts, recent activity |
| Events.jsx | /events | List, create, manage financial events |
| Expenses.jsx | /expenses | Full expense CRUD with filters |
| Login.jsx | /login | User login form |
| Register.jsx | /register | New user registration form |
| Profile.jsx | /profile | User profile and settings |
| NotFound.jsx | * | 404 fallback page |

### Services (client/src/services/)

| File | Purpose |
|------|---------|
| pi.js | Axios instance with base URL and JWT interceptor |
| uthService.js | Login, register, profile API calls |
| eventService.js | Event CRUD API calls |
| expenseService.js | Expense CRUD API calls |

### Context (client/src/context/)

| File | Purpose |
|------|---------|
| AuthContext.jsx | Global auth state — user, token, login/logout |

### Utils & Styles

| File | Purpose |
|------|---------|
| utils/helpers.js | Shared utility functions (formatting, date, currency) |
| styles/globals.css | Global CSS custom properties and base styles |
| index.css | Tailwind directives entry |
| App.css | App-level scoped styles |

---

## ⚙️ Server — Node.js + Express Backend

### Entry Point

| File | Purpose |
|------|---------|
| src/index.js | App bootstrap — Express setup, middleware, route mounting, server start |
| src/config/db.js | MongoDB connection via Mongoose |

### Models (server/src/models/)

| File | Collection | Key Fields |
|------|------------|------------|
| User.js | users | name, email, password (hashed), role, createdAt |
| Expense.js | expenses | title, amount, category, date, userId, eventId |
| Event.js | events | name, description, budget, totalSpent, userId |

### Controllers (server/src/controllers/)

| File | Responsibilities |
|------|-----------------|
| uthController.js | Register, login, get profile, JWT generation |
| expenseController.js | CRUD for expenses, filters, pagination |
| eventController.js | CRUD for events, budget tracking |
| iController.js | Claude API calls — categorize, insights, chat |

### Routes (server/src/routes/)

| File | Prefix | Mounted Endpoints |
|------|--------|-------------------|
| uthRoutes.js | /api/auth | POST /register, POST /login, GET /profile |
| expenseRoutes.js | /api/expenses | GET /, POST /, PUT /:id, DELETE /:id |
| eventRoutes.js | /api/events | GET /, POST /, PUT /:id, DELETE /:id |
| iRoutes.js | /api/ai | POST /categorize, GET /insights, POST /ask |

### Middleware (server/src/middleware/)

| File | Purpose |
|------|---------|
| uthMiddleware.js | Verify JWT token, attach user to req |
| errorHandler.js | Central error response formatter |

---

## 🌐 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | \/api/auth/register\ | ❌ | Register new user |
| POST | \/api/auth/login\ | ❌ | Login, returns JWT |
| GET | \/api/auth/profile\ | ✅ | Get logged-in user profile |
| GET | \/api/expenses\ | ✅ | List all expenses (paginated) |
| POST | \/api/expenses\ | ✅ | Create new expense |
| PUT | \/api/expenses/:id\ | ✅ | Update expense by ID |
| DELETE | \/api/expenses/:id\ | ✅ | Delete expense by ID |
| GET | \/api/events\ | ✅ | List all events |
| POST | \/api/events\ | ✅ | Create new event |
| PUT | \/api/events/:id\ | ✅ | Update event by ID |
| DELETE | \/api/events/:id\ | ✅ | Delete event by ID |
| POST | \/api/ai/categorize\ | ✅ | AI auto-categorize an expense |
| GET | \/api/ai/insights\ | ✅ | AI spending insights for user |
| POST | \/api/ai/ask\ | ✅ | Chat with AI about your finances |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Tailwind CSS, Custom CSS Variables |
| Charts | Recharts |
| HTTP Client | Axios |
| Auth State | React Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Anthropic Claude API |
| Deployment | Vercel (client), Render (server) |

---

## 🚀 Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/Sudharsanv06/ai-finance-tracker.git
cd ai-finance-tracker

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Configure environment
# Create server/.env with the variables below

# 4. Run both servers
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

---

## 🔐 Environment Variables

> Create \server/.env\ with:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

---

## 📌 Project Status

| Area | Status |
|------|--------|
| Project Setup | ✅ Complete |
| Auth System (JWT) | ✅ Complete |
| Expense CRUD | ✅ Complete |
| Event CRUD | ✅ Complete |
| AI Integration (Claude) | ✅ Complete |
| ChatBot Component | ✅ Complete |
| Dashboard & Charts | ✅ Complete |
| Testing | ⏳ Pending |
| Deployment | ⏳ Pending |

---

*Generated automatically — re-run this script to refresh.*
