import { useState } from 'react';
import { useAuth }  from '../context/AuthContext';
import api          from '../services/api';
import { getInitials } from '../utils/helpers';

const ROLE_CONFIG = {
  Organizer:    { color: 'bg-teal-50 text-teal border-teal-200',     icon: '🎯' },
  Approver:     { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '✅' },
  FinanceAdmin: { color: 'bg-green-50 text-green-700 border-green-200', icon: '💼' },
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();

  // ── Name update ───────────────────────────────────────────────────────────
  const [name,        setName]        = useState(user?.name  || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg,     setNameMsg]     = useState('');
  const [nameError,   setNameError]   = useState('');

  // ── Password update ───────────────────────────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [passLoading,      setPassLoading]      = useState(false);
  const [passMsg,          setPassMsg]          = useState('');
  const [passError,        setPassError]        = useState('');

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.Organizer;

  // ── Handle name update ────────────────────────────────────────────────────
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setNameError(''); setNameMsg('');

    if (!name.trim())               return setNameError('Name is required');
    if (name.trim() === user?.name) return setNameError('No changes made');

    setNameLoading(true);
    try {
      const res         = await api.put('/auth/profile', { name: name.trim() });
      const updatedUser = { ...user, name: res.data.data.user.name };
      updateUser(updatedUser);
      setNameMsg('Name updated successfully');
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update name');
    } finally {
      setNameLoading(false);
    }
  };

  // ── Handle password update ────────────────────────────────────────────────
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassError(''); setPassMsg('');

    if (!currentPassword)          return setPassError('Current password is required');
    if (newPassword.length < 6)    return setPassError('New password must be at least 6 characters');
    if (newPassword !== confirmPassword)
                                   return setPassError('Passwords do not match');
    if (newPassword === currentPassword)
                                   return setPassError('New password must be different');

    setPassLoading(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPassMsg('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-container max-w-2xl">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">Manage your account settings</p>
          </div>
        </div>

        {/* ── User Card ─────────────────────────────────────────── */}
        <div className="card p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-teal flex items-center
                          justify-center text-cream text-2xl font-bold
                          font-playfair shrink-0 shadow-teal-md">
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-teal font-playfair">
              {user?.name}
            </h2>
            <p className="text-sm text-teal-400 mt-0.5">{user?.email}</p>
            <span className={`badge border mt-2 ${roleConfig.color}`}>
              {roleConfig.icon} {user?.role === 'FinanceAdmin' ? 'Finance Admin' : user?.role}
            </span>
          </div>
        </div>

        {/* ── Update Name ───────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="section-title mb-1">Update Name</h2>
          <p className="text-xs text-teal-400 mb-5">
            Change your display name
          </p>

          {nameError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50
                            border border-red-200 text-red-600 text-sm">
              ⚠️ {nameError}
            </div>
          )}
          {nameMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50
                            border border-green-200 text-green-700 text-sm">
              ✅ {nameMsg}
            </div>
          )}

          <form onSubmit={handleNameUpdate} noValidate className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={nameLoading}
              className="btn-primary w-full"
            >
              {nameLoading
                ? <span className="spinner" />
                : 'Update Name'}
            </button>
          </form>
        </div>

        {/* ── Change Password ───────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="section-title mb-1">Change Password</h2>
          <p className="text-xs text-teal-400 mb-5">
            Keep your account secure
          </p>

          {passError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50
                            border border-red-200 text-red-600 text-sm">
              ⚠️ {passError}
            </div>
          )}
          {passMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50
                            border border-green-200 text-green-700 text-sm">
              ✅ {passMsg}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} noValidate className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="input"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="input"
                autoComplete="new-password"
              />
              {newPassword.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map((i) => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        newPassword.length >= i * 3
                          ? newPassword.length < 6 ? 'bg-red-400'
                          : newPassword.length < 10 ? 'bg-amber-400'
                          : 'bg-teal'
                          : 'bg-teal-100'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`input ${
                  confirmPassword.length > 0
                    ? confirmPassword === newPassword
                      ? 'border-green-400'
                      : 'border-red-400'
                    : ''
                }`}
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={passLoading}
              className="btn-primary w-full"
            >
              {passLoading
                ? <span className="spinner" />
                : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ── Danger Zone ───────────────────────────────────────── */}
        <div className="card p-6 border-red-200">
          <h2 className="section-title mb-1 text-red-600">Danger Zone</h2>
          <p className="text-xs text-teal-400 mb-5">
            Irreversible account actions
          </p>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
                window.location.href = '/login';
              }
            }}
            className="btn-danger w-full"
          >
            Logout from all devices
          </button>
        </div>

      </div>
    </div>
  );
}