# Project Overview — EventFi (AI-Powered Finance Tracker)

EventFi is a full-featured personal and event finance tracker designed to run seamlessly across desktop browsers and mobile platforms. The system combines robust budget tracking, event finance authorization chains, an investment portfolio manager, personal loan management, bill reminders, and context-aware financial advice powered by AI (Groq + Llama 3.1).

---

## SECTION 1: WEB APPLICATION (Vercel Deployment)

### 1. Project Summary
The EventFi Web Application consists of a backend Node.js REST API and a React web dashboard. The system is designed to handle general personal financial tracking alongside specialized event budgeting.
*   **Target Audience & Roles**: 
    *   `Organizer`: Submits and updates expenses linked to events.
    *   `Approver`: Reviews submitted expenses, approving or rejecting them (specifying rejection reasons).
    *   `FinanceAdmin`: Has full control to create, modify, and delete transactions, events, and approve payments.
*   **Core Feature Suite**:
    *   **Dashboard**: Financial metrics (Monthly Income, Expenses, Balance, Budget Status, and Upcoming Bills) with Recharts-based visual graphs.
    *   **Event Manager**: Allows organizations or individuals to set up events, define total budgets, and monitor cumulative costs in real-time.
    *   **Expense Approval Workflow**: Pending → Approved / Rejected → Paid. Expenses submitted under specific events dynamically increment or decrement the event's spent amount upon approval.
    *   **AI Financial Assistant**: Floating chat widget powered by Groq's `llama-3.1-8b-instant` model. Injects the user's real-time financial summaries directly into the AI context for tailored advice. Includes an AI categorization endpoint that auto-detects standard expense categories from natural language descriptions.
    *   **Income, Loans & Savings Goals**: Modules for managing income (with recurring schedules), tracking personal loans (given/taken EMIs and interest progress), and setting saving limits (deadline and milestones).
    *   **Family Finance & Recurring Bills**: Dynamic pages to aggregate family income streams and monitor upcoming bills with due date alerts.

---

### 2. Folder & File Structure
Below is the directory structure for Section 1, encompassing both the backend (`server/`) and web client (`client/`):

```
ai-finance-tracker/
├── client/                             # React + Vite Web Frontend
│   ├── public/                         # Static assets
│   │   ├── favicon.svg                 # Application tab icon
│   │   └── icons.svg                   # SVG icon definitions
│   ├── src/                            # React Source Code
│   │   ├── assets/                     # Graphical assets (hero.png, logos)
│   │   ├── components/                 # Shared UI elements
│   │   │   ├── ApprovalActions.jsx     # Controls for expense approval workflow
│   │   │   ├── BudgetRing.jsx          # Circular SVG utilization indicators
│   │   │   ├── ChatBot.jsx             # AI chat floating drawer
│   │   │   ├── ConfirmModal.jsx        # Confirmation dialogs
│   │   │   ├── EmptyState.jsx          # Placeholder for empty lists
│   │   │   ├── EventCard.jsx           # Cards showing event parameters and budgets
│   │   │   ├── EventForm.jsx           # Form modal to write/edit events
│   │   │   ├── ExpenseForm.jsx         # Form to submit expenses (w/ AI categories)
│   │   │   ├── ExpenseTable.jsx        # Data table for expense list with filters
│   │   │   ├── Navbar.jsx              # Main header and sidebar navigation
│   │   │   ├── Pagination.jsx          # Component for pagination controls
│   │   │   ├── ProtectedRoute.jsx      # Navigation guard wrapping auth pages
│   │   │   └── StatCard.jsx            # Reusable KPI visual block
│   │   ├── context/                    
│   │   │   └── AuthContext.jsx         # Context provider for JWT session state
│   │   ├── pages/                      # Page components
│   │   │   ├── Bills.jsx               # Recurring bill manager
│   │   │   ├── BudgetPlanner.jsx       # Monthly budget allocations page
│   │   │   ├── Dashboard.jsx           # Aggregated statistics and charts
│   │   │   ├── Events.jsx              # Event listings and budget targets
│   │   │   ├── Expenses.jsx            # Expenses hub and approval sheets
│   │   │   ├── Family.jsx              # Set up family members' income tracking
│   │   │   ├── Goals.jsx               # Saving milestones and deadlines
│   │   │   ├── Income.jsx              # Input dashboard for income sources
│   │   │   ├── Investments.jsx         # Portfolio manager (stocks, mutual funds, gold)
│   │   │   ├── Loans.jsx               # Personal lending/debt ledger
│   │   │   ├── Login.jsx               # Sign-in portal page
│   │   │   ├── NotFound.jsx            # 404 fallback page
│   │   │   ├── Profile.jsx             # User profile settings and password change
│   │   │   └── Register.jsx            # Form page for user registration
│   │   ├── services/                   # Axios API service adapters
│   │   │   ├── api.js                  # Axios setup w/ auth and response interceptors
│   │   │   ├── authService.js          # Authentication endpoint wrappers
│   │   │   ├── billService.js          # Bill endpoints CRUD
│   │   │   ├── budgetService.js        # Budget planner endpoint calls
│   │   │   ├── eventService.js         # Event management API calls
│   │   │   ├── expenseService.js       # Expense and CSV export calls
│   │   │   ├── familyService.js        # Family profiles endpoints
│   │   │   ├── goalService.js          # Savings milestones API methods
│   │   │   ├── incomeService.js        # Revenue tracking operations
│   │   │   ├── investmentService.js    # Stock & SIP portfolio endpoints
│   │   │   └── loanService.js          # Loan ledger operations
│   │   ├── styles/                     
│   │   │   └── globals.css             # Tailwind base and theme overlays
│   │   ├── utils/                      
│   │   │   └── helpers.js              # Currency formatters and helper constants
│   │   ├── App.css                     # Component style custom definitions
│   │   ├── App.jsx                     # Router config and providers initialization
│   │   ├── index.css                   # Global styles loader
│   │   └── main.jsx                    # Root DOM entry point
│   ├── eslint.config.js                # Linter presets
│   ├── index.html                      # HTML document wrapper
│   ├── package.json                    # Frontend node dependencies
│   ├── postcss.config.js               # CSS compiler configuration
│   ├── tailwind.config.js              # Custom Tailwind configuration
│   ├── vercel.json                     # Vercel SPA redirects config
│   └── vite.config.js                  # Vite bundler parameters
│
└── server/                             # Node.js + Express API Backend
    ├── src/                            # API Source Code
    │   ├── config/                     
    │   │   └── db.js                   # Mongoose Database connection logic
    │   ├── controllers/                # REST logic handlers
    │   │   ├── aiController.js         # Chat and categorization Groq connectors
    │   │   ├── authController.js       # Signup, login, and profile updating
    │   │   ├── billController.js       # Bill management CRUD
    │   │   ├── budgetController.js     # Monthly spending thresholds manager
    │   │   ├── eventController.js      # Event creation, updation, deletion
    │   │   ├── expenseController.js    # Expense approvals, updates, and exports
    │   │   ├── familyController.js     # Family profiles registry CRUD
    │   │   ├── goalController.js       # Milestones updates
    │   │   ├── incomeController.js     # Income source entry handlers
    │   │   ├── investmentController.js # Stock/SIP/FD portfolios
    │   │   └── loanController.js       # Debt recording and EMI tracking
    │   ├── middleware/                 
    │   │   ├── authMiddleware.js       # JWT validation & role permissions check
    │   │   └── errorHandler.js         # Custom Express error formatter
    │   ├── models/                     # Mongoose Schema definitions
    │   │   ├── Bill.js                 # Schema for recurring bills
    │   │   ├── Budget.js               # Schema for monthly budgets
    │   │   ├── Event.js                # Schema for events (budget/spent)
    │   │   ├── Expense.js              # Schema for individual expenses
    │   │   ├── FamilyMember.js         # Schema for family listings
    │   │   ├── Goal.js                 # Schema for savings goals
    │   │   ├── Income.js               # Schema for income entries
    │   │   ├── Investment.js           # Schema for investment items
    │   │   ├── Loan.js                 # Schema for loans & EMI histories
    │   │   └── User.js                 # Schema for user data and security
    │   ├── routes/                     # Route to controller mappings
    │   │   ├── aiRoutes.js             # Routes for AI chat/categorize
    │   │   ├── authRoutes.js           # Routes for auth
    │   │   ├── billRoutes.js           # Routes for bills
    │   │   ├── budgetRoutes.js         # Routes for budgets
    │   │   ├── eventRoutes.js          # Routes for events
    │   │   ├── expenseRoutes.js        # Routes for expenses
    │   │   ├── familyRoutes.js         # Routes for family settings
    │   │   ├── goalRoutes.js           # Routes for goals
    │   │   ├── incomeRoutes.js         # Routes for income
    │   │   ├── investmentRoutes.js     # Routes for investments
    │   │   └── loanRoutes.js           # Routes for loans
    │   └── index.js                    # Server main entry point
    ├── .env                            # Local backend environment properties
    └── package.json                    # Backend node dependencies
```

---

### 3. Tech Stack & Installations

#### A. Web Client Tech Stack
*   **Runtime/Build**: React 19.2.6 (Vite 8.0.12)
*   **Routing**: React Router DOM 7.17.0
*   **Styling**: TailwindCSS 3.4.19 (PostCSS 8.5.15 & Autoprefixer 10.5.0)
*   **Data Fetching**: Axios 1.17.0
*   **Charts**: Recharts 3.8.1

#### B. API Server Tech Stack
*   **Framework**: Express 4.18.2 (ES Modules)
*   **Database**: MongoDB Atlas via Mongoose 8.0.3
*   **Security & Sanitization**: Helmet 7.1.0, CORS 2.8.5, express-mongo-sanitize 2.2.0, xss-clean 0.1.4
*   **Rate Limiting**: express-rate-limit 7.1.5 (Capped at 10,000 requests per 15 minutes)
*   **Cryptography**: bcryptjs 2.4.3 (12 salt rounds), jsonwebtoken 9.0.2
*   **AI Integration**: groq-sdk 0.3.3

#### C. Installation & Configuration

##### 1. Clone & Set Up Backend
```bash
cd server
npm install
```
Create a `.env` file inside the `server/` directory and populate it:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/eventfi?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_hash_key_64_characters
JWT_EXPIRE=7d
GROQ_API_KEY=gsk_your_groq_api_key_here
CLIENT_URL=http://localhost:5173
```

##### 2. Set Up Web Client
```bash
cd ../client
npm install
```
Create a `.env` file inside the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

##### 3. Start Development Mode
*   **Start Backend Server**: In `server/`, run: `npm run dev` (starts server on `http://localhost:5000`)
*   **Start Web Client**: In `client/`, run: `npm run dev` (launches dashboard on `http://localhost:5173`)

---

### 4. Architecture & How It Works

#### Request/Response Flow
1.  The web client triggers actions (e.g., submitting an expense, asking the AI chatbot).
2.  Axios interceptors capture the request, inject the `Authorization: Bearer <token>` header, and forward the request to the backend.
3.  The Express server passes the request through the global security middleware layer (Helmet, CORS, NoSQL and XSS Sanitizers, Rate Limiting).
4.  If the route is protected, the request enters the `protect` middleware which verifies the JWT signature.
5.  Role-based authorization checks (`authorize('Approver')`) are applied if necessary.
6.  The request hits the controller. If the database is required, Mongoose retrieves/modifies collections in MongoDB Atlas.
7.  The controller sends a JSON response back to the client.
8.  If a `401 Unauthorized` response occurs, the client's response interceptor intercepts the error, clears user data from local storage, and redirects the browser to `/login`.

```
[React Web App]  ──(Axios Interceptor + JWT)──>  [Express Router]
                                                      │
                                            (Helmet / CORS / XSS)
                                                      │
                                            (authMiddleware.js)
                                                      │
                                            [Controller Logic]
                                                      │
                             ┌────────────────────────┴────────────────────────┐
                             ▼                                                 ▼
                    [MongoDB Mongoose]                                  [Groq AI SDK]
```

#### State Management Approach
EventFi utilizes the native React Context API (`client/src/context/AuthContext.jsx`) to manage global authentication state:
*   On login, the backend returns the signed JWT token and user profile object.
*   The `AuthContext` writes these values to `localStorage` and keeps an in-memory `user` state.
*   Axios uses this token for subsequent calls.
*   All pages are guarded by `ProtectedRoute.jsx`, which evaluates the context's `isAuthenticated` flag to block or allow navigation.

#### Backend API Route Reference

| Route Path | Method | Access | Controller Handler | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | `register` | Registers a new user with a specific role |
| `/api/auth/login` | POST | Public | `login` | Validates credentials, returns JWT & user details |
| `/api/auth/me` | GET | Private | `getProfile` | Retrieves the current user's profile info |
| `/api/auth/password` | PUT | Private | `updatePassword` | Updates the logged-in user's password |
| `/api/events` | GET | Private | `getEvents` | Fetches active events created by the user |
| `/api/events` | POST | Private | `createEvent` | Creates a new event with a budget target |
| `/api/events/:id` | PUT | Private | `updateEvent` | Edits event details, dates, or total budget |
| `/api/events/:id` | DELETE | Private | `deleteEvent` | Deletes an event |
| `/api/expenses` | GET | Private | `getExpenses` | Fetches expenses with pagination and filters |
| `/api/expenses` | POST | Private | `createExpense` | Logs an expense (updates event spent if approved/paid) |
| `/api/expenses/:id` | PUT | Private | `updateExpense` | Edits expense information |
| `/api/expenses/:id` | DELETE | Private | `deleteExpense` | Deletes expense (subtracts from event spent) |
| `/api/expenses/:id/approve`| PUT | Private | `approveExpense` | Approves a pending expense (updates event budget) |
| `/api/expenses/:id/reject` | PUT | Private | `rejectExpense` | Rejects a pending expense with a reason |
| `/api/expenses/:id/pay` | PUT | Private | `markAsPaid` | Sets an approved expense as paid |
| `/api/expenses/export/csv` | GET | Private | `exportExpensesCSV` | Generates and downloads a CSV export of expenses |
| `/api/income` | GET/POST | Private | `incomeController` | Retrieves/Creates income entries |
| `/api/investments` | GET/POST | Private | `investmentController` | Portfolio listings and assets additions |
| `/api/loans` | GET/POST | Private | `loanController` | Manage borrowed/lent debts and pay EMIs |
| `/api/budgets` | GET/POST | Private | `budgetController` | Set monthly category caps and alerts |
| `/api/goals` | GET/POST | Private | `goalController` | Set saving targets, deadlines, and tracking progress |
| `/api/bills` | GET/POST | Private | `billController` | Create recurring bills, mark paid/unpaid status |
| `/api/family` | GET/POST | Private | `familyController` | Add family members for shared finance oversight |
| `/api/ai/chat` | POST | Private | `chat` | Conversational Llama 3.1 chatbot with context |
| `/api/ai/categorize` | POST | Private | `categorizeExpense` | Auto-detects category from expense description |

#### Database Models & Schemas

##### 1. User Schema (`User.js`)
*   `name` (String, Required, 2-50 chars)
*   `email` (String, Required, Unique, Lowercase)
*   `password` (String, Required, Excluded from general queries)
*   `role` (String, Enum: `['Organizer', 'Approver', 'FinanceAdmin']`, Default: `Organizer`)
*   *Security Middleware*: A pre-save hook automatically hashes passwords using `bcryptjs` (12 rounds) when modified. Has instance method `matchPassword(enteredPassword)`.

##### 2. Event Schema (`Event.js`)
*   `name` (String, Required, Max 100 chars)
*   `description` (String, Max 500 chars)
*   `date` (Date)
*   `category` (String, Enum: `['Venue', 'Catering', ... 'Others']`, Default: `Others`)
*   `totalBudget` (Number, Required, >= 0)
*   `spentAmount` (Number, Default: 0)
*   `status` (String, Enum: `['active', 'upcoming', 'completed', 'draft', 'cancelled']`, Default: `active`)
*   `createdBy` (ObjectId referencing `User`, Required)
*   *Virtuals*:
    *   `utilization`: Calculates budget depletion: `Math.round((spentAmount / totalBudget) * 100)`
    *   `remaining`: Remaining funds: `totalBudget - spentAmount`

##### 3. Expense Schema (`Expense.js`)
*   `description` (String, Required, Max 200 chars)
*   `amount` (Number, Required, Min: 1)
*   `category` (String, Enum: `['Venue', 'Catering', ... 'Others']`)
*   `paymentMethod` (String, Enum: `['Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'Cheque', 'Other']`)
*   `date` (Date, Default: Date.now)
*   `approvalStatus` (String, Enum: `['Pending', 'Approved', 'Rejected', 'Paid']`, Default: `Pending`)
*   `eventId` (ObjectId referencing `Event`, Nullable if personal)
*   `submittedBy` (ObjectId referencing `User`, Required)
*   `approvedBy` (ObjectId referencing `User`, Nullable)
*   `rejectionReason` (String)
*   `receiptUrl` (String)
*   `notes` (String, Max 300 chars)

##### 4. Loan Schema (`Loan.js`)
*   `title` (String, Required)
*   `type` (String, Enum: `['taken', 'given']`)
*   `loanFrom` / `loanTo` (String)
*   `category` (String, Enum: `['Home Loan', 'Car Loan', ... 'Other']`)
*   `principal` (Number, Required)
*   `interestRate` (Number, Annual %)
*   `tenureMonths` (Number)
*   `emiAmount` (Number)
*   `startDate` (Date)
*   `totalPaid` (Number)
*   `status` (String, Enum: `['active', 'completed', 'defaulted']`)
*   `payments` (Array of objects: `{ amount, date, note, isPaid }`)
*   *Virtuals*:
    *   `remainingAmount`: Calculates principal + interest and subtracts `totalPaid`.
    *   `paidEMIs`: Returns the payments array length.
    *   `progressPercent`: Calculates the percentage of loan repayment.

##### 5. Budget Schema (`Budget.js`)
*   `category` (String, Enum of personal categories)
*   `monthlyLimit` (Number)
*   `month` (Number, 1-12)
*   `year` (Number)
*   `spent` (Number, Default 0)
*   `alertAt` (Number, Default 80%)

##### 6. Bill Schema (`Bill.js`)
*   `title` (String)
*   `amount` (Number)
*   `category` (String, Enum: Rent, Electric, Water, Internet, Subscriptions, etc.)
*   `dueDate` (Number, Day of month 1-31)
*   `isPaid` (Boolean)
*   `lastPaidMonth` / `lastPaidYear` (Number)
*   *Virtuals*:
    *   `isDueThisMonth`: Checks if the bill is unpaid and due in the current calendar cycle.
    *   `daysUntilDue`: Calculates the remaining days until the due date.

---

### 5. Key Code Logic

#### A. Conversational Context Injection (`aiController.js`)
The chatbot injects user data directly into the system instructions. Before invoking the LLM, the backend queries MongoDB for the user's records and formats a text block of metrics:
```javascript
const events = await Event.find({ createdBy: req.user._id }).limit(10);
const expenses = await Expense.find({ submittedBy: req.user._id }).populate('eventId').limit(20);

const totalBudget = events.reduce((s, e) => s + (e.totalBudget || 0), 0);
const totalSpent  = events.reduce((s, e) => s + (e.spentAmount  || 0), 0);
const pending     = expenses.filter((e) => e.approvalStatus === 'Pending').length;

const contextText = `
Current user: ${req.user.name} (${req.user.role})
Total budget across events: ₹${totalBudget.toLocaleString('en-IN')}
Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Pending approvals: ${pending}
...
`;
```
This data is prepended to the system prompt, giving the model real-time context on the user's budget.

#### B. Dynamic Expense approval hooks (`expenseController.js`)
When an expense's approval status changes to `Approved` or `Paid`, its amount must be reflected in the linked event's budget. The server handles this transactionally:
*   **On Create**: If pre-approved (or not event-linked), increment the event's spent amount.
*   **On Update**: Subtract the old amount from the old event, and add the new amount to the new event (if approved/paid).
*   **On Approve**: Transition the status to `Approved` and increment the event's spent amount:
    ```javascript
    expense.approvalStatus = 'Approved';
    await expense.save();
    await Event.findByIdAndUpdate(expense.eventId, {
      $inc: { spentAmount: expense.amount },
    });
    ```
*   **On Delete**: If approved/paid, decrement the event's spent amount before removing the record.

#### C. Request Interceptors (`client/src/services/api.js`)
Axios interceptors ensure standard headers are injected without manually appending them in every component:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 6. Deployment
EventFi is configured for deployment on **Vercel** for the React frontend, while the backend can be hosted on Render, Railway, or Vercel Serverless.

#### Frontend Web Deployment (Vercel)
1.  **Vercel Configuration (`vercel.json`)**:
    Vercel must route all incoming traffic back to the single-page application entry point (`/index.html`):
    ```json
    {
      "rewrites": [
        {
          "source": "/(.*)",
          "destination": "/index.html"
        }
      ]
    }
    ```
2.  **Dashboard Settings**:
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   **Environment Variables**: Add `VITE_API_URL` set to your live backend domain (e.g., `https://eventfi-server.onrender.com/api`).

---
---

## SECTION 2: MOBILE APPLICATION

### 1. Mobile App Summary
The EventFi Mobile Application is built using **Expo SDK 56 + React Native 0.85**. It provides a native mobile interface for logging and monitoring personal and event budgets.
*   **Difference from Web**:
    *   **Live Multi-Account Balance Engine**: The mobile dashboard tracks starting balances for four account types (`Main Account`, `Savings Account`, `Credit Card`, and `Cash`) stored on-device using `AsyncStorage`.
    *   **On-Device Cash Flow Modeling**: Calculates current balances using starting values and historical data (e.g., cash withdrawals subtract from bank and add to cash, self-transfers subtract from bank and add to savings).
    *   **Custom Numeric Keypad Interface**: Rather than using standard system keyboards, transaction pages feature an integrated numeric keypad with customizable animations for quick input.
    *   **Local Notification Interceptions**: Displays local, context-aware alert cards (e.g., bills due within 3 days or budget utilization exceeding 80%) directly on the mobile dashboard.

---

### 2. Folder & File Structure
Directory structure of the `mobile/` app workspace:

```
mobile/
├── assets/                             # App launcher icons and splash screens
│   ├── android-icon-background.png     
│   ├── android-icon-foreground.png     
│   ├── android-icon-monochrome.png     
│   ├── favicon.png                     
│   ├── icon.png                        # Main launcher icon
│   └── splash-icon.png                 # Splash screen image
├── src/                                # Application Source
│   ├── components/                     
│   │   └── ChatBot.jsx                 # AI chatbot overlay with speech/text inputs
│   ├── context/                        
│   │   └── AuthContext.jsx             # Mobile Auth Context via AsyncStorage
│   ├── navigation/                     
│   │   └── AppNavigator.jsx            # Tab + Stack navigator definitions
│   ├── screens/                        # Native app screen interfaces
│   │   ├── AddTransactionScreen.jsx    # Numeric keypad transaction submission page
│   │   ├── BillRemindersScreen.jsx    # Scheduler and pay switches for bills
│   │   ├── BudgetPlannerScreen.jsx    # Setting monthly budget categories
│   │   ├── DashboardScreen.jsx         # Balance cards, alerts, stats & notification center
│   │   ├── EventsScreen.jsx            # Event listing and budget rings
│   │   ├── ExpensesScreen.jsx          # Transaction history with details
│   │   ├── GoalsScreen.jsx             # Savings goals lists and progress bars
│   │   ├── IncomeScreen.jsx            # Revenue tracker screen
│   │   ├── InvestmentsScreen.jsx      # Stocks, gold, PPF, and FD investment portfolios
│   │   ├── LoansScreen.jsx             # Borrowed/lent tracking and EMI payments log
│   │   ├── LoginScreen.jsx             # Mobile sign-in
│   │   ├── ProfileScreen.jsx           # User statistics and sign-out
│   │   ├── RegisterScreen.jsx          # Mobile sign-up with role options
│   │   └── SettingsScreen.jsx          # Developer variables and style options
│   ├── services/                       # API integration modules
│   │   ├── api.js                      # Axios instance with cache buster and auth header
│   │   ├── authService.js              
│   │   ├── billService.js              
│   │   ├── budgetService.js            
│   │   ├── expenseService.js           
│   │   ├── familyService.js            
│   │   ├── goalService.js              
│   │   ├── incomeService.js            
│   │   ├── investmentService.js        
│   │   └── loanService.js              
│   └── utils/                          
│       └── helpers.js                  # Global color palettes & number formatters
├── App.jsx                             # App root loading routes and context
├── app.json                            # Expo configuration parameters
├── eas.json                            # EAS profiles for APK packaging
└── index.js                            # Mobile application registration
```

---

### 3. Tech Stack & Installations

#### A. Mobile Tech Stack
*   **Framework**: Expo SDK ~56.0.9 (Managed Workflow)
*   **Core**: React Native 0.85.3, React 19.2.3
*   **Navigation**: React Navigation 7 (Native Stack + Bottom Tabs)
*   **Storage**: `@react-native-async-storage/async-storage` 2.2.0
*   **Networking**: Axios 1.17.0
*   **UI Components & Icons**: `@expo/vector-icons` (Ionicons)
*   **Device Safe Space**: `react-native-safe-area-context` & `react-native-screens`

#### B. Installation & Set Up

##### 1. System Requirements
*   Node.js (LTS version >= 18)
*   For testing via emulator:
    *   **Android**: Android Studio with an active Android Virtual Device (AVD).
    *   **iOS**: macOS with Xcode Command Line Tools and Simulator installed.
*   **Expo Go**: Download the Expo Go application from the Google Play Store or Apple App Store to test on physical devices.

##### 2. Mobile Project Setup
```bash
cd mobile
npm install
```

##### 3. Local Development Run
*   **Start Expo Server**: Run `npm start`
*   **Key Controls in Terminal**:
    *   Press `a` to run the app in the Android emulator.
    *   Press `i` to run the app in the iOS simulator.
    *   Scan the terminal's QR code using the Expo Go app on a physical device (same Wi-Fi network).

---

### 4. Architecture & How It Works

#### communication with the Backend
The mobile app communicates with the Express backend using the service layer defined in `mobile/src/services/api.js`.
*   **CORS & IP Address Configuration**: By default, the app is configured to call the production Render server: `https://eventfi-server.onrender.com/api`. To connect to a local backend during development, update the `baseURL` to your machine's local IP address (e.g., `http://192.168.1.100:5000/api`). Avoid using `localhost` or `127.0.0.1`, as Android/iOS emulators run inside virtual environments and cannot resolve them.

#### Cache-Busting Interceptor
Mobile devices tend to aggressively cache GET requests. The request interceptor in `mobile/src/services/api.js` appends a unique timestamp `_t` and `_uid` to bypass caching for all GET requests:
```javascript
if (config.method?.toLowerCase() === 'get') {
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  config.params = {
    ...config.params,
    _t: Date.now(),
  };
}
```

#### Navigation Flow (`AppNavigator.jsx`)
The application uses a nested navigation model. The root stack evaluates the user's authentication status:
*   **Unauthenticated Stack**: Login Screen → Register Screen.
*   **Authenticated Stack**: Main Tab Navigator + Sub-Stack screens.

```
                  ┌───────────────────────┐
                  │   AppNavigator Stack  │
                  └───────────┬───────────┘
                              │
                    Is Authenticated?
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       [Unauthenticated]              [Authenticated]
        ├── Login                      ├── Main Tabs
        └── Register                   │    ├── Home (Dashboard)
                                       │    ├── Transaction (Expenses)
                                       │    ├── Add Button (Triggers stack)
                                       │    ├── Analytics (Events)
                                       │    └── More (Profile)
                                       ├── Goals
                                       ├── Loans
                                       ├── AddTransaction (Form)
                                       ├── BudgetPlanner
                                       ├── BillReminders
                                       ├── Investments
                                       └── Settings
```

---

### 5. Key Code Logic

#### On-Device Balance Calculation Engine (`DashboardScreen.jsx`)
The mobile dashboard computes balances dynamically. When loading, it retrieves the user's configured starting balances from `AsyncStorage`. It then fetches the full history of expenses and income, applying business logic based on categories and payment methods:
```javascript
const allCashExpenses = allExpenses
  .filter(e => e.paymentMethod === 'Cash' && e.approvalStatus !== 'Rejected')
  .reduce((sum, e) => sum + e.amount, 0);

const allBankExpenses = allExpenses
  .filter(e => (e.paymentMethod === 'Bank Transfer' || e.paymentMethod === 'UPI' || e.paymentMethod === 'Cheque') && e.approvalStatus !== 'Rejected')
  .reduce((sum, e) => sum + e.amount, 0);

// Transfers and Withdrawals:
const totalCashWithdrawals = allExpenses
  .filter(e => e.category === 'Cash Withdrawal' && e.approvalStatus !== 'Rejected')
  .reduce((sum, e) => sum + e.amount, 0);

const totalSelfTransfers = allExpenses
  .filter(e => e.category === 'Self Transfer' && e.approvalStatus !== 'Rejected')
  .reduce((sum, e) => sum + e.amount, 0);
```
Balances for each account are calculated relative to these figures:
*   **Main Account**: `Starting + Total Income - Bank Expenses - Cash Withdrawals - Self Transfers`
*   **Savings Account**: `Starting + Self Transfers`
*   **Cash**: `Starting + Cash Withdrawals - Cash Expenses`
*   **Credit Card**: `Limit - Credit Card Expenses`

---

### 6. Build & Run Instructions

#### A. Running on Emulator / Simulator
1.  Verify the Android Emulator (via Android Studio) or iOS Simulator (via Xcode) is running.
2.  In the `mobile/` directory:
    ```bash
    # For Android
    npm run android

    # For iOS
    npm run ios
    ```

#### B. Building Binaries with EAS (Expo Application Services)
EventFi is configured to compile standalone Android APKs using EAS Build.

##### 1. Prerequisites
*   Install EAS CLI globally: `npm install -g eas-cli`
*   Log in to your Expo account: `eas login`

##### 2. Project Configuration (`app.json`)
The application configuration contains the EAS project ID and bundle mapping:
```json
{
  "expo": {
    "name": "EventFi",
    "slug": "eventfi",
    "version": "1.0.0",
    "android": {
      "package": "com.sudharsan7.eventfi"
    },
    "extra": {
      "eas": {
        "projectId": "08119862-0412-4fb5-b00d-434c3a157d38"
      }
    }
  }
}
```

##### 3. EAS Build Configuration (`eas.json`)
The build configuration defines target formats, outputting a standard APK rather than an Android App Bundle (AAB):
```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

##### 4. Triggering Builds
*   **Build Preview APK (Android)**:
    Run the following command to generate a shareable APK:
    ```bash
    eas build --profile preview --platform android
    ```
    EAS will compile the application in the cloud. Once complete, it will provide a direct download link and QR code for the compiled `.apk`.
*   **Local pre-built binary**: A precompiled APK release is available in the root directory as `EventFi.apk`.

---
*Last Updated: June 2026 | EventFi AI Finance Tracker Documentation*
