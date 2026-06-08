import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate       = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Already logged in → redirect
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim())    return setError('Email is required');
    if (!password)        return setError('Password is required');

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center
                    justify-center px-4 py-12">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
                          shadow-teal-md mb-4">
            <span className="text-cream text-2xl font-bold
                             font-playfair">E</span>
          </div>
          <h1 className="text-3xl font-bold text-teal font-playfair">
            EventFi
          </h1>
          <p className="text-sm text-teal-400 mt-1">
            Smart Event Finance Manager
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-bold text-teal font-playfair mb-1">
            Welcome Back
          </h2>
          <p className="text-sm text-teal-400 mb-6">
            Sign in to your account
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50
                            border border-red-200 text-red-600
                            text-sm animate-scaleIn">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

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
                placeholder="Your password"
                className="input"
                autoComplete="current-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-2"
            >
              {loading
                ? <span className="spinner" />
                : 'Sign In →'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-teal-400 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-teal font-semibold hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}