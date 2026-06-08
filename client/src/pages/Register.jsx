import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    value: 'Organizer',
    label: 'Organizer',
    desc:  'Create events & submit expenses',
    icon:  '🎯',
  },
  {
    value: 'Approver',
    label: 'Approver',
    desc:  'Review & approve expenses',
    icon:  '✅',
  },
  {
    value: 'FinanceAdmin',
    label: 'Finance Admin',
    desc:  'Full access & payments',
    icon:  '💼',
  },
];

export default function Register() {
  const navigate          = useNavigate();
  const { register }      = useAuth();

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role,            setRole]            = useState('Organizer');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim())     return setError('Full name is required');
    if (!email.trim())    return setError('Email is required');
    if (password.length < 6)
                          return setError('Password must be at least 6 characters');
    if (password !== confirmPassword)
                          return setError('Passwords do not match');

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
            Create Account
          </h2>
          <p className="text-sm text-teal-400 mb-6">
            Join EventFi and manage event finances
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

            {/* Role selector */}
            <div>
              <label className="label">Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex flex-col items-center gap-1
                                px-2 py-3 rounded-xl border-2 text-center
                                transition-all duration-200 ${
                      role === r.value
                        ? 'border-teal bg-teal-50 text-teal'
                        : 'border-teal-100 bg-white text-teal-400 hover:border-teal-200'
                    }`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-[11px] font-bold leading-tight">
                      {r.label}
                    </span>
                    <span className="text-[9px] opacity-70 leading-tight">
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>
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