'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] text-sm transition';
const btnPrimary = 'px-4 py-2 rounded-lg bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition';

export default function ProfilePage() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) { toast.error('Current password is required'); return; }
    if (!newPassword) { toast.error('New password is required'); return; }
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    try {
      setLoading(true);
      await api.post('/api/auth/change-password', { oldPassword, newPassword });
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-slate-400 py-8 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

      {/* User Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">Account Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Full Name</label>
            <p className="text-slate-800 text-sm font-medium">{user.name}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <p className="text-slate-800 text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Roles</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-1 rounded-full bg-[#25439b]/10 text-[#25439b] text-xs font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              user.isActive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">Change Password</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              className={inputCls}
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              className={inputCls}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              className={inputCls}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
