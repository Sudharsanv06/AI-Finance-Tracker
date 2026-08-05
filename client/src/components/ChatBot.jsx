import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

// ── Bot Icon Component ──────────────────────────────────────────────────────
const BotIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="8" cy="16" r="1.5" />
    <circle cx="16" cy="16" r="1.5" />
    <path strokeLinecap="round" d="M9 2h6M12 2v3M12 8a3 3 0 013 3H9a3 3 0 013-3z" />
  </svg>
);

const TrashIcon = ({ className = "w-4 h-4 text-cream" }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SUGGESTIONS = [
  'How is my budget utilization?',
  'Which events are over budget?',
  'How many pending approvals?',
  'Give me a spending summary',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center
                       text-xs font-bold shrink-0 mt-0.5 ${
        isUser
          ? 'bg-teal text-cream'
          : 'bg-cream-dark text-teal border border-teal-100'
      }`}>
        {isUser ? 'U' : <BotIcon className="w-4 h-4 text-teal" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm
                       leading-relaxed ${
        isUser
          ? 'bg-teal text-cream rounded-tr-sm'
          : 'bg-white border border-teal-100 text-teal rounded-tl-sm shadow-teal-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-7 h-7 rounded-full bg-cream-dark border
                      border-teal-100 flex items-center justify-center
                      shrink-0">
        <BotIcon className="w-4 h-4 text-teal" />
      </div>
      <div className="bg-white border border-teal-100 rounded-2xl
                      rounded-tl-sm px-4 py-3 shadow-teal-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-teal rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role:    'assistant',
      content: "Hi! I'm your Paisa Pulse AI assistant. Ask me anything about your events, budgets, or expenses.",
    },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      Promise.resolve().then(() => {
        setUnread(0);
      });
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMsg = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: messageText,
        history: messages,
      });

      const reply = res.data?.data?.reply || 'Sorry, I could not generate a reply.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (!isOpen) {
        setUnread((u) => u + 1);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'An error occurred. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role:    'assistant',
        content: "Hi! I'm your Paisa Pulse AI assistant. Ask me anything about your events, budgets, or expenses.",
      },
    ]);
  };

  return (
    <>
      {/* ── Chat Panel ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:right-6 z-50
                        w-[calc(100vw-2rem)] max-w-sm
                        bg-cream rounded-2xl shadow-teal-lg
                        border border-teal-100 flex flex-col
                        animate-slideUp overflow-hidden"
             style={{ height: '480px' }}>

          {/* Header */}
          <div className="bg-teal px-4 py-3 flex items-center
                          justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-cream/20
                              flex items-center justify-center">
                <BotIcon className="w-5 h-5 text-cream" />
              </div>
              <div>
                <p className="text-cream text-sm font-bold
                               font-playfair">
                  Paisa Pulse AI
                </p>
                <p className="text-cream/60 text-[10px]">
                  Powered by Groq
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-cream/60 hover:text-cream
                           transition-colors text-xs px-2 py-1
                           rounded-lg hover:bg-white/10 flex items-center justify-center"
                title="Clear chat"
              >
                <TrashIcon />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-cream/60 hover:text-cream
                           transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (show only at start) */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto
                            scrollbar-hide shrink-0">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 bg-white border border-teal-100
                             rounded-xl text-xs text-teal font-medium
                             whitespace-nowrap hover:bg-teal-50
                             hover:border-teal-200 transition-all
                             shadow-teal-sm shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-teal-100
                          shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                disabled={loading}
                className="flex-1 input py-2.5 text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-teal
                           hover:bg-teal-600 disabled:opacity-40
                           disabled:cursor-not-allowed transition-all
                           flex items-center justify-center shrink-0
                           shadow-teal-sm"
              >
                {loading ? (
                  <span className="spinner w-4 h-4 border-cream" />
                ) : (
                  <svg className="w-4 h-4 text-cream" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-teal-300 text-center mt-2">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Button ──────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 md:right-6 z-50
                   w-14 h-14 rounded-2xl bg-teal hover:bg-teal-600
                   shadow-teal-lg hover:shadow-teal-lg
                   transition-all duration-200 hover:-translate-y-1
                   flex items-center justify-center
                   active:scale-95"
        title="Open AI Assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-cream" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round"
                  strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <BotIcon className="w-6 h-6 text-cream" />
        )}

        {/* Unread badge */}
        {unread > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5
                           rounded-full bg-red-500 text-white
                           text-[10px] font-bold flex items-center
                           justify-center animate-scaleIn">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}