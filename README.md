# EventFi — Smart Event Finance Manager

A full-stack AI-powered event budget management application with
multi-role approval workflows and real-time financial tracking.

## 🚀 Live Demo
- Frontend: (add vercel url after deployment)
- Backend:  (add railway url after deployment)

## ✨ Features
- 🔐 JWT Authentication with 3 roles (Organizer, Approver, FinanceAdmin)
- 📅 Event creation and budget tracking
- 💸 Expense submission and approval workflow
- ✅ Multi-tier approval (Pending → Approved → Paid)
- 🤖 AI-powered expense categorization (Groq)
- 💬 AI Financial Chatbot (Groq LLaMA)
- 📊 Dashboard with spending charts
- 🎨 Premium UI with Playfair Display font

## 🛠️ Tech Stack
### Frontend
- React 18 + Vite
- Tailwind CSS
- Recharts
- React Router v6
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Groq AI (LLaMA 3.1)

## 🏃 Local Setup

### Backend
cd server
npm install
# Create .env with MONGO_URI, JWT_SECRET, GROQ_API_KEY
npm run dev

### Frontend
cd client
npm install
npm run dev

## 👤 Author
Sudharsan V — github.com/Sudharsanv06