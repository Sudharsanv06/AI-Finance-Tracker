import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream flex items-center
                    justify-center px-4">
      <div className="text-center animate-slideUp">
        <div className="text-8xl font-bold text-teal/10
                        font-playfair mb-4 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-teal font-playfair mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-teal-400 mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}