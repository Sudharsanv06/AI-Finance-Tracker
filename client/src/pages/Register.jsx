import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/adaptive-icon.png';

export default function Register() {
  const navigate       = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role]                  = useState('FinanceAdmin');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Redirect if logged in
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      return setError('All fields are required');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await register({ name, email, password, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col justify-center
                    items-center p-4 relative font-sans">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96
                        rounded-full bg-teal/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96
                        rounded-full bg-teal/5" />
      </div>

      <div className="relative w-full max-w-md animate-slideUp">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center
                          w-14 h-14 rounded-2xl bg-teal
                          shadow-teal-md mb-4 overflow-hidden">
            <img src={logoImg} alt="Paisa Pulse Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-teal font-playfair">
            Paisa Pulse
          </h1>
          <p className="text-sm text-teal-400 mt-1">
            Smart Personal & Event Finance Manager
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-teal font-playfair mb-1">
            Create Account
          </h2>
          <p className="text-sm text-teal-400 mb-6">
            Join Paisa Pulse and manage your finances
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50
                            border border-red-200 text-red-600
                            text-sm animate-scaleIn flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sudharsan V"
                className="input"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="input"
                autoComplete="new-password"
              />
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        password.length >= i * 3
                          ? password.length < 6
                            ? 'bg-red-400'
                            : password.length < 10
                            ? 'bg-amber-400'
                            : 'bg-teal'
                          : 'bg-teal-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`input ${
                  confirmPassword.length > 0
                    ? confirmPassword === password
                      ? 'border-green-400 focus:border-green-500'
                      : 'border-red-400 focus:border-red-500'
                    : ''
                }`}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 &&
                confirmPassword !== password && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-2"
            >
              {loading
                ? <span className="spinner" />
                : 'Create Account →'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-teal-400 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-teal font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}