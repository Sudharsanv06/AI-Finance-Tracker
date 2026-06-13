# EventFi — AI-Powered Finance Tracker

> **Full-stack personal & event finance management platform with AI assistant, cross-platform mobile app, and a rich web dashboard.**

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Backend — Server](#5-backend--server)
   - [Entry Point & Middleware](#entry-point--middleware)
   - [REST API Routes](#rest-api-routes)
   - [Data Models](#data-models)
   - [Authentication](#authentication)
   - [AI Integration](#ai-integration)
6. [Frontend — Web Client](#6-frontend--web-client)
   - [Pages & Routing](#pages--routing)
   - [Components](#components)
   - [Services & API Layer](#services--api-layer)
7. [Mobile App — React Native / Expo](#7-mobile-app--react-native--expo)
   - [Screens](#screens)
   - [Navigation](#navigation)
8. [Deployment & Build](#8-deployment--build)
9. [Environment Variables](#9-environment-variables)
10. [Getting Started](#10-getting-started)
11. [Feature Summary](#11-feature-summary)

---

## 1. Project Summary

**EventFi** is a comprehensive, AI-powered finance tracker built to manage both personal finances and event budgets from a single platform. It offers:

- A **React + Vite web dashboard** for full-feature desktop access.
- A **React Native / Expo mobile app** (APK available: `EventFi.apk`) for on-the-go access.
- A **Node.js / Express REST API** backed by **MongoDB Atlas** for all data operations.
- An **AI financial assistant** powered by **Groq's Llama 3.1 8B Instant** model that provides context-aware advice based on the user's real financial data.

The platform supports three user roles — `Organizer`, `Approver`, and `FinanceAdmin` — enabling team-based event expense workflows with approval chains.

---

## 2. Tech Stack

| Layer         | Technology                                    |
|---------------|-----------------------------------------------|
| **Web Client**| React 19, Vite 8, React Router DOM 7, Recharts 3, TailwindCSS 3, Axios |
| **Mobile**    | React Native 0.85, Expo ~56, React Navigation 7 (Stack + Bottom Tabs), AsyncStorage, Axios |
| **Backend**   | Node.js (ESM), Express 4, MongoDB Atlas, Mongoose 8 |
| **Auth**      | JSON Web Tokens (JWT, 7-day expiry), bcryptjs (salt rounds: 12) |
| **AI**        | Groq SDK (`llama-3.1-8b-instant`)            |
| **Security**  | Helmet, CORS, express-rate-limit (100 req/15 min), express-mongo-sanitize, xss-clean |
| **Dev Tools** | Nodemon, ESLint, Vite HMR                     |
| **Deploy**    | Vercel (client), EAS Build — APK (mobile)    |

---

## 3. Repository Structure

```
ai-finance-tracker/
├── client/                     # React + Vite web frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # 13 shared UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state
│   │   ├── pages/              # 14 route-level page components
│   │   ├── services/           # 11 Axios service modules + api.js
│   │   ├── styles/
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx             # Router + auth provider root
│   │   ├── main.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── vercel.json             # SPA rewrite rules for Vercel
│
├── server/                     # Express REST API backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # MongoDB Atlas connection
│   │   ├── controllers/        # 11 controller modules
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # JWT protect + role authorize
│   │   │   └── errorHandler.js
│   │   ├── models/             # 10 Mongoose schemas
│   │   ├── routes/             # 11 Express router files
│   │   └── index.js            # Server entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
├── mobile/                     # React Native / Expo mobile app
│   ├── src/
│   │   ├── components/
│   │   │   └── ChatBot.jsx     # AI chatbot UI
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Mobile auth state (AsyncStorage)
│   │   ├── navigation/
│   │   │   └── AppNavigator.jsx # Stack + Bottom Tab navigator
│   │   ├── screens/            # 9 screen components
│   │   ├── services/           # 6 API service modules
│   │   └── utils/
│   │       └── helpers.js      # COLORS constants + utilities
│   ├── assets/
│   ├── App.jsx                 # Mobile app root
│   ├── index.js
│   ├── app.json                # Expo config (slug: eventfi)
│   └── eas.json                # EAS build config (APK)
│
├── EventFi.apk                 # Pre-built Android APK
├── PROJECT_OVERVIEW.md
├── README.md
└── .gitignore
```

---

## 4. Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│                                                                   │
│   ┌─────────────────────┐        ┌────────────────────────────┐  │
│   │  Web App (Vite/React)│        │ Mobile App (Expo/RN)       │  │
│   │  localhost:5173      │        │ expo start / EventFi.apk   │  │
│   └──────────┬──────────┘        └─────────────┬──────────────┘  │
└──────────────┼───────────────────────────────────┼───────────────┘
               │  Axios + Bearer JWT               │ Axios + Bearer JWT
               ▼                                   ▼
┌───────────────────────────────────────────────────────────────────┐
│                    SERVER (Express API)                           │
│                         PORT 5000                                 │
│                                                                   │
│  Middleware Stack:                                                │
│  Helmet → CORS → Body Parser → MongoSanitize → XSS → RateLimit   │
│                                                                   │
│  /api/auth       /api/expenses    /api/income     /api/budgets   │
│  /api/events     /api/investments /api/loans      /api/goals     │
│  /api/family     /api/bills       /api/ai                        │
│                                                                   │
│  JWT Auth Middleware → Controllers → Mongoose Models              │
└──────────────────────────────┬────────────────────────────────────┘
                               │ Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                                 │
│  Collections: users, events, expenses, incomes, investments,    │
│               loans, budgets, goals, bills, familymembers       │
└─────────────────────────────────────────────────────────────────┘
                               │ groq-sdk
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Groq API (llama-3.1-8b-instant)                 │
│  - AI Chat with live financial context injection                │
│  - Automatic expense category suggestion                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Backend — Server

### Entry Point & Middleware

**File:** `server/src/index.js`

The server applies the following middleware stack in order:

1. `express.json({ limit: '10mb' })` — body parsing
2. `express-mongo-sanitize` — NoSQL injection prevention
3. `xss-clean` — XSS payload stripping
4. `helmet` — security HTTP headers
5. `cors` — restricted to `CLIENT_URL` origin
6. `express-rate-limit` — 100 requests per 15 minutes on `/api/*`

Server starts on **PORT 5000** (configurable via `.env`).

### REST API Routes

| Prefix               | Router File             | Controller               | Description                                   |
|----------------------|-------------------------|--------------------------|-----------------------------------------------|
| `POST /api/auth`     | `authRoutes.js`         | `authController.js`      | Register, login, get profile, update password |
| `GET/POST/PUT/DELETE /api/events`       | `eventRoutes.js`        | `eventController.js`     | Event CRUD, budget tracking                   |
| `GET/POST/PUT/DELETE /api/expenses`     | `expenseRoutes.js`      | `expenseController.js`   | Expense CRUD, approval workflow               |
| `GET/POST/PUT/DELETE /api/income`       | `incomeRoutes.js`       | `incomeController.js`    | Income entries, recurring support             |
| `GET/POST/PUT/DELETE /api/investments`  | `investmentRoutes.js`   | `investmentController.js`| Investment portfolio tracking                 |
| `GET/POST/PUT/DELETE /api/loans`        | `loanRoutes.js`         | `loanController.js`      | Loan tracking, EMI payment recording          |
| `GET/POST/PUT/DELETE /api/budgets`      | `budgetRoutes.js`       | `budgetController.js`    | Monthly category budget limits                |
| `GET/POST/PUT/DELETE /api/goals`        | `goalRoutes.js`         | `goalController.js`      | Savings goal tracking                         |
| `GET/POST/PUT/DELETE /api/bills`        | `billRoutes.js`         | `billController.js`      | Recurring bill reminders                      |
| `GET/POST/PUT/DELETE /api/family`       | `familyRoutes.js`       | `familyController.js`    | Family member management                      |
| `POST /api/ai/chat`  | `aiRoutes.js`           | `aiController.js`        | AI chat with financial context                |
| `POST /api/ai/categorize` | `aiRoutes.js`      | `aiController.js`        | AI-powered expense categorization             |
| `GET /api/health`    | *(inline)*              | —                        | Health check endpoint                         |

### Data Models

All models reside in `server/src/models/` as Mongoose schemas.

#### `User`
| Field      | Type     | Notes                                         |
|------------|----------|-----------------------------------------------|
| `name`     | String   | 2–50 chars, required                          |
| `email`    | String   | Unique, lowercase, validated format           |
| `password` | String   | Hashed (bcrypt, salt 12), excluded from queries |
| `role`     | String   | `Organizer` (default) \| `Approver` \| `FinanceAdmin` |

> Methods: `matchPassword(enteredPassword)` — async bcrypt compare.

#### `Event`
| Field         | Type     | Notes                                                       |
|---------------|----------|-------------------------------------------------------------|
| `name`        | String   | Max 100 chars                                               |
| `description` | String   | Max 500 chars                                               |
| `date`        | Date     |                                                             |
| `category`    | String   | Venue / Catering / Decoration / Entertainment / Marketing / Equipment / Staff / Transportation / Conference / Wedding / Corporate / Others |
| `totalBudget` | Number   | Required, ≥ 0                                               |
| `spentAmount` | Number   | Auto-updated by expense operations                          |
| `status`      | String   | `active` \| `upcoming` \| `completed` \| `draft` \| `cancelled` |
| `createdBy`   | ObjectId | Ref: User                                                   |

> Virtuals: `utilization` (%), `remaining` (₹).

#### `Expense`
| Field             | Type     | Notes                                                          |
|-------------------|----------|----------------------------------------------------------------|
| `description`     | String   | Max 200 chars                                                  |
| `amount`          | Number   | Min 1                                                          |
| `category`        | String   | Venue / Catering / Decoration / Entertainment / Marketing / Equipment / Staff / Transportation / Others |
| `paymentMethod`   | String   | Cash / Bank Transfer / Credit Card / UPI / Cheque / Other     |
| `date`            | Date     | Defaults to now                                                |
| `approvalStatus`  | String   | `Pending` (default) \| `Approved` \| `Rejected` \| `Paid`    |
| `eventId`         | ObjectId | Ref: Event                                                     |
| `submittedBy`     | ObjectId | Ref: User                                                      |
| `approvedBy`      | ObjectId | Ref: User (nullable)                                           |
| `rejectionReason` | String   |                                                                |
| `receiptUrl`      | String   |                                                                |
| `notes`           | String   | Max 300 chars                                                  |

#### `Income`
| Field          | Type     | Notes                                                             |
|----------------|----------|-------------------------------------------------------------------|
| `source`       | String   | Salary / Freelance / Business / Rental / Investment Returns / Gift / Bonus / Other |
| `amount`       | Number   | Min 1                                                             |
| `date`         | Date     |                                                                   |
| `description`  | String   |                                                                   |
| `isRecurring`  | Boolean  | Flag for recurring incomes                                        |
| `frequency`    | String   | `monthly` \| `weekly` \| `yearly` \| `one-time`                  |
| `familyMember` | ObjectId | Ref: FamilyMember (nullable)                                      |
| `userId`       | ObjectId | Ref: User                                                         |

#### `Investment`
| Field                  | Type     | Notes                                                     |
|------------------------|----------|-----------------------------------------------------------|
| `name`                 | String   |                                                           |
| `type`                 | String   | SIP / FD / Stocks / Gold / PPF / NPS / Mutual Fund / Real Estate / Crypto / Other |
| `platform`             | String   | e.g., Zerodha, Groww                                      |
| `investedAmount`       | Number   |                                                           |
| `currentValue`         | Number   |                                                           |
| `startDate`            | Date     |                                                           |
| `maturityDate`         | Date     |                                                           |
| `interestRate`         | Number   | Annual %                                                  |
| `monthlyContribution`  | Number   | For SIPs                                                  |
| `status`               | String   | `active` \| `matured` \| `withdrawn`                      |
| `userId`               | ObjectId |                                                           |

> Virtuals: `returnsAmount` (₹), `returnsPercent` (%).

#### `Loan`
| Field          | Type     | Notes                                                             |
|----------------|----------|-------------------------------------------------------------------|
| `title`        | String   |                                                                   |
| `type`         | String   | `taken` \| `given`                                                |
| `loanFrom`     | String   | Lender name                                                       |
| `loanTo`       | String   | Borrower name                                                     |
| `category`     | String   | Home / Car / Personal / Education / Business / Gold / Friend-Family / Other |
| `principal`    | Number   |                                                                   |
| `interestRate` | Number   | Annual %                                                          |
| `tenureMonths` | Number   |                                                                   |
| `emiAmount`    | Number   |                                                                   |
| `startDate`    | Date     |                                                                   |
| `endDate`      | Date     |                                                                   |
| `totalPaid`    | Number   | Cumulative paid                                                   |
| `status`       | String   | `active` \| `completed` \| `defaulted`                           |
| `payments`     | Array    | Sub-schema: `{ amount, date, note, isPaid }`                     |
| `userId`       | ObjectId |                                                                   |

> Virtuals: `remainingAmount`, `paidEMIs`, `progressPercent` (%).

#### `Budget`
| Field          | Type     | Notes                                                             |
|----------------|----------|-------------------------------------------------------------------|
| `category`     | String   | Food & Dining / Transportation / Shopping / Entertainment / Health / Education / Utilities / Rent / Groceries / Travel / Personal Care / Other |
| `monthlyLimit` | Number   |                                                                   |
| `month`        | Number   | 1–12                                                              |
| `year`         | Number   |                                                                   |
| `spent`        | Number   | Tracked spending                                                  |
| `alertAt`      | Number   | Alert threshold %, default 80                                     |
| `userId`       | ObjectId |                                                                   |

> Virtuals: `utilization` (%), `remaining` (₹), `isOver` (bool), `needsAlert` (bool).

#### `Goal`
| Field                 | Type     | Notes                                                        |
|-----------------------|----------|--------------------------------------------------------------|
| `title`               | String   |                                                              |
| `category`            | String   | Emergency Fund / Vacation / Home Purchase / Car Purchase / Education / Wedding / Retirement / Business / Other |
| `targetAmount`        | Number   |                                                              |
| `currentAmount`       | Number   |                                                              |
| `monthlyContribution` | Number   |                                                              |
| `deadline`            | Date     |                                                              |
| `status`              | String   | `active` \| `completed` \| `paused`                         |
| `icon`                | String   | Emoji, defaults to 🎯                                        |
| `userId`              | ObjectId |                                                              |

> Virtuals: `progressPercent` (%), `remainingAmount` (₹), `monthsToGoal`.

#### `Bill`
| Field           | Type     | Notes                                                           |
|-----------------|----------|-----------------------------------------------------------------|
| `title`         | String   |                                                                 |
| `amount`        | Number   |                                                                 |
| `category`      | String   | Rent / Electricity / Water / Internet / Phone / Insurance / Subscription / EMI / Gas / Credit Card / Other |
| `dueDate`       | Number   | Day of month (1–31)                                             |
| `isRecurring`   | Boolean  |                                                                 |
| `frequency`     | String   | `monthly` \| `quarterly` \| `yearly`                           |
| `isPaid`        | Boolean  |                                                                 |
| `paidDate`      | Date     |                                                                 |
| `lastPaidMonth` | Number   |                                                                 |
| `lastPaidYear`  | Number   |                                                                 |
| `autoPay`       | Boolean  |                                                                 |
| `userId`        | ObjectId |                                                                 |

> Virtuals: `isDueThisMonth` (bool), `daysUntilDue` (number).

#### `FamilyMember`
Stores family member profiles linked to the user for multi-member income tracking.

### Authentication

**File:** `server/src/middleware/authMiddleware.js`

- **`protect`** — Verifies `Authorization: Bearer <token>` header using `jsonwebtoken`. Attaches `req.user` (without password) for downstream handlers. Returns `401` on invalid/missing tokens.
- **`authorize(...roles)`** — Role-based access control middleware. Returns `403` if `req.user.role` is not in the allowed roles list.

JWT tokens expire in **7 days**. The auth controller issues tokens on login and registration.

### AI Integration

**File:** `server/src/controllers/aiController.js`

Uses the **Groq SDK** (`groq-sdk@0.3.3`) with model `llama-3.1-8b-instant`.

| Endpoint                  | Function             | Description                                                              |
|---------------------------|----------------------|--------------------------------------------------------------------------|
| `POST /api/ai/chat`       | `chat`               | Conversational AI with live financial context (events, expenses, totals) injected into the system prompt. Maintains a 6-message rolling history. Response capped at 512 tokens. |
| `POST /api/ai/categorize` | `categorizeExpense`  | Single-purpose categorizer — returns one of 9 predefined expense categories from a description. Uses low temperature (0.1) for deterministic output. Max 10 tokens. |

---

## 6. Frontend — Web Client

**Directory:** `client/`  
**Stack:** React 19 + Vite 8 + React Router DOM 7 + TailwindCSS 3 + Recharts 3 + Axios

### Pages & Routing

**File:** `client/src/App.jsx`

All routes except `/login` and `/register` are wrapped in `<ProtectedRoute>` which checks `AuthContext` for a valid session.

| Route          | Page Component     | Description                                              |
|----------------|--------------------|----------------------------------------------------------|
| `/login`       | `Login.jsx`        | Authentication page                                      |
| `/register`    | `Register.jsx`     | User registration with role selection                    |
| `/dashboard`   | `Dashboard.jsx`    | Overview stats, charts, recent activity                  |
| `/events`      | `Events.jsx`       | Event management — create, list, track budgets           |
| `/expenses`    | `Expenses.jsx`     | Event expense submission and approval management         |
| `/income`      | `Income.jsx`       | Income entry tracking with recurring support             |
| `/investments` | `Investments.jsx`  | Full investment portfolio manager                        |
| `/loans`       | `Loans.jsx`        | Loan tracking with EMI payment recording                 |
| `/budget`      | `BudgetPlanner.jsx`| Monthly category budget planning with alerts             |
| `/goals`       | `Goals.jsx`        | Savings goals with progress tracking                     |
| `/bills`       | `Bills.jsx`        | Recurring bill tracker and reminder system               |
| `/family`      | `Family.jsx`       | Family member management                                 |
| `/profile`     | `Profile.jsx`      | User profile and settings                                |
| `/`            | *(redirect)*       | Redirects to `/dashboard`                                |
| `*`            | `NotFound.jsx`     | 404 fallback                                             |

### Components

**Directory:** `client/src/components/`

| Component            | Description                                                   |
|----------------------|---------------------------------------------------------------|
| `Navbar.jsx`         | Main navigation bar with links and user menu                  |
| `ChatBot.jsx`        | AI chatbot widget — floating interface calling `/api/ai/chat` |
| `ExpenseTable.jsx`   | Sortable/filterable expense table with pagination             |
| `ExpenseForm.jsx`    | Expense creation form with AI-assisted category suggestion    |
| `EventCard.jsx`      | Card view for individual events with budget ring              |
| `EventForm.jsx`      | Event creation/edit modal form                                |
| `ApprovalActions.jsx`| Approve/reject controls for Approver/FinanceAdmin roles       |
| `BudgetRing.jsx`     | Circular SVG progress ring for budget utilization             |
| `StatCard.jsx`       | Metric summary cards used across the dashboard                |
| `ConfirmModal.jsx`   | Generic confirmation dialog                                   |
| `EmptyState.jsx`     | Empty list placeholder with call-to-action                    |
| `Pagination.jsx`     | Generic pagination controls                                   |
| `ProtectedRoute.jsx` | Auth guard using React Router outlet pattern                  |

> **Charts** are rendered using **Recharts** — `MonthlyBarChart.jsx` and `ExpensePieChart.jsx` are referenced in the Charts sub-directory.

### Services & API Layer

**File:** `client/src/services/api.js`

A central Axios instance configured with:
- `baseURL` — reads from `VITE_API_URL` env var or falls back to `/api` (Vercel proxy compatible).
- **Request interceptor** — auto-attaches `Authorization: Bearer <token>` from `localStorage`.
- **Response interceptor** — clears localStorage and redirects to `/login` on `401` responses.

| Service File         | Endpoints Wrapped                                     |
|----------------------|-------------------------------------------------------|
| `authService.js`     | `register`, `login`, `getProfile`, `updatePassword`   |
| `expenseService.js`  | `getExpenses`, `createExpense`, `updateExpense`, `deleteExpense`, `updateApproval` |
| `eventService.js`    | `getEvents`, `createEvent`, `updateEvent`, `deleteEvent` |
| `incomeService.js`   | `getIncomes`, `createIncome`, `updateIncome`, `deleteIncome` |
| `investmentService.js`| `getInvestments`, `createInvestment`, `updateInvestment`, `deleteInvestment` |
| `loanService.js`     | `getLoans`, `createLoan`, `updateLoan`, `deleteLoan`, `addPayment` |
| `budgetService.js`   | `getBudgets`, `createBudget`, `updateBudget`, `deleteBudget` |
| `goalService.js`     | `getGoals`, `createGoal`, `updateGoal`, `deleteGoal`  |
| `billService.js`     | `getBills`, `createBill`, `updateBill`, `deleteBill`, `markPaid` |
| `familyService.js`   | `getFamilyMembers`, `addMember`, `updateMember`, `deleteMember` |

### Context

**File:** `client/src/context/AuthContext.jsx`

Provides `{ user, token, login, logout, isAuthenticated }` to the entire React tree via Context API.

---

## 7. Mobile App — React Native / Expo

**Directory:** `mobile/`  
**App Name:** EventFi | **Bundle ID:** `com.sudharsan7.eventfi`  
**Expo Version:** ~56 | **React Native:** 0.85.3  
**EAS Project ID:** `08119862-0412-4fb5-b00d-434c3a157d38`

### Screens

**Directory:** `mobile/src/screens/`

| Screen              | Description                                              |
|---------------------|----------------------------------------------------------|
| `LoginScreen.jsx`   | Login form with JWT auth                                 |
| `RegisterScreen.jsx`| Registration form                                        |
| `DashboardScreen.jsx`| Financial summary and key metrics                       |
| `EventsScreen.jsx`  | Event listing, creation, and budget tracking             |
| `ExpensesScreen.jsx`| Expense management and approval status                   |
| `IncomeScreen.jsx`  | Income tracking                                          |
| `LoansScreen.jsx`   | Loan tracking with EMI payment recording                 |
| `GoalsScreen.jsx`   | Savings goals (file present, size not listed — may be empty/WIP) |
| `ProfileScreen.jsx` | User profile and logout                                  |

### Navigation

**File:** `mobile/src/navigation/AppNavigator.jsx`

Uses a **Stack Navigator** wrapping a **Bottom Tab Navigator**:

```
AppNavigator (Stack)
├── [Unauthenticated]
│   ├── Login      → LoginScreen
│   └── Register   → RegisterScreen
└── [Authenticated]
    ├── Main (Bottom Tabs)
    │   ├── 📊 Dashboard → DashboardScreen
    │   ├── 📅 Events    → EventsScreen
    │   ├── 💸 Expenses  → ExpensesScreen
    │   ├── 💰 Income    → IncomeScreen
    │   └── ☰  More     → ProfileScreen
    ├── Goals        → GoalsScreen (stack push)
    └── Loans        → LoansScreen (stack push)
```

Authentication state is managed by `mobile/src/context/AuthContext.jsx` using **AsyncStorage** for persistent token storage.

### Mobile Components

| Component         | Description                                            |
|-------------------|--------------------------------------------------------|
| `ChatBot.jsx`     | AI chatbot screen (mirrors web ChatBot functionality)  |

---

## 8. Deployment & Build

### Web Client (Vercel)

- **`client/vercel.json`** configures SPA routing: all paths rewrite to `/index.html`.
- Build command: `npm run build` → `vite build`
- Set `VITE_API_URL` env var to the deployed backend URL.

### Backend (Any Node Host)

- Requires Node.js with ESM support (`"type": "module"`).
- Start: `node src/index.js` | Dev: `nodemon src/index.js`
- All env vars must be set (see section below).

### Mobile (EAS Build)

- **Preview APK**: Run `eas build --profile preview --platform android`
- **Pre-built APK**: `EventFi.apk` (~75 MB) is available at the project root.
- EAS CLI version required: `>= 5.0.0`

---

## 9. Environment Variables

### Server (`server/.env`)

| Variable       | Example / Notes                                         |
|----------------|---------------------------------------------------------|
| `NODE_ENV`     | `production` or `development`                           |
| `PORT`         | `5000`                                                  |
| `MONGO_URI`    | MongoDB Atlas connection string                         |
| `JWT_SECRET`   | 256-bit hex secret for signing JWTs                     |
| `JWT_EXPIRE`   | `7d`                                                    |
| `GROQ_API_KEY` | API key from [console.groq.com](https://console.groq.com) |
| `CLIENT_URL`   | Allowed CORS origin, e.g. `http://localhost:5173`       |

### Web Client (`client/.env`)

| Variable       | Notes                                                   |
|----------------|---------------------------------------------------------|
| `VITE_API_URL` | Backend URL, e.g. `https://your-api.com/api` (optional — defaults to `/api`) |

---

## 10. Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account
- Groq API key

### 1. Clone & Install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Install mobile dependencies
cd ../mobile && npm install
```

### 2. Configure Environment

```bash
# Copy and edit the server env file
cp server/.env.example server/.env
# Fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start web frontend
cd client && npm run dev

# Terminal 3: Start mobile app
cd mobile && npm start
```

The web app will be available at `http://localhost:5173` and the API at `http://localhost:5000`.

---

## 11. Feature Summary

| Feature                        | Web | Mobile | Notes                                                  |
|--------------------------------|:---:|:------:|--------------------------------------------------------|
| User Registration & Login      | ✅  | ✅     | JWT-based, role-aware                                  |
| Role-based Access Control      | ✅  | ✅     | Organizer / Approver / FinanceAdmin                    |
| Event Budget Management        | ✅  | ✅     | Create events with budgets; track spending             |
| Expense Submission & Approval  | ✅  | ✅     | Multi-step: Pending → Approved/Rejected → Paid         |
| AI Financial Chatbot           | ✅  | ✅     | Context-aware Groq/Llama 3.1 responses                 |
| AI Expense Categorization      | ✅  | —      | Auto-suggests category from description                |
| Income Tracking                | ✅  | ✅     | Multi-source, recurring support                        |
| Investment Portfolio           | ✅  | —      | 10 investment types, returns tracking                  |
| Loan Manager                   | ✅  | ✅     | Taken/given, EMI payment history, progress tracking    |
| Budget Planner                 | ✅  | —      | Monthly category limits, alert thresholds              |
| Savings Goals                  | ✅  | ✅     | Target/current/monthly contribution, deadline          |
| Recurring Bills                | ✅  | —      | Due date reminders, auto-pay flag                      |
| Family Finance                 | ✅  | —      | Multi-member income aggregation                        |
| Charts & Analytics             | ✅  | —      | Recharts: bar charts, pie charts                       |
| Pagination                     | ✅  | —      | Supported in expense table and lists                   |
| Security Hardening             | ✅  | ✅     | Rate limiting, helmet, XSS/NoSQL sanitization          |

---

*Last updated: June 2026 | Project: EventFi AI Finance Tracker*
