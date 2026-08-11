import { useState } from 'react';
import { useAuth }  from '../context/AuthContext';
import api          from '../services/api';
import { getInitials } from '../utils/helpers';

const ROLE_CONFIG = {
  Organizer:    { color: 'bg-teal-50 text-teal border-teal-200',     dotColor: 'bg-teal' },
  Approver:     { color: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-500' },
  FinanceAdmin: { color: 'bg-green-50 text-green-700 border-green-200', dotColor: 'bg-green-600' },
};

export default function Profile() {
  const { user, logout, updateUser } = useAuth();

  // ── Name update ───────────────────────────────────────────────────────────
  const [name,        setName]        = useState(user?.name  || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg,     setNameMsg]     = useState('');
  const [nameError,   setNameError]   = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('File size must be under 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setUploadingPhoto(true);
      try {
        const res = await api.put('/auth/profile', {
          name: user.name,
          profilePhoto: base64String,
        });
        updateUser(res.data.data.user);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to upload photo');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
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
          <div className="relative group w-16 h-16 rounded-2xl bg-teal overflow-hidden flex items-center
                          justify-center text-cream text-2xl font-bold
                          font-playfair shrink-0 shadow-teal-md cursor-pointer">
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.name)
            )}
            <label htmlFor="photo-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center
                                                    opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {uploadingPhoto ? (
                <span className="text-xs text-cream font-sans">...</span>
              ) : (
                <svg className="w-7 h-7 text-cream drop-shadow-md" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              )}
            </label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="photo-upload"
              onChange={handlePhotoChange}
              disabled={uploadingPhoto}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-teal font-playfair">
              {user?.name}
            </h2>
            <p className="text-sm text-teal-400 mt-0.5">{user?.email}</p>
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
                            border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{nameError}</span>
            </div>
          )}
          {nameMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50
                            border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{nameMsg}</span>
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
                            border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{passError}</span>
            </div>
          )}
          {passMsg && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50
                            border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{passMsg}</span>
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


      </div>
    </div>
  );
}