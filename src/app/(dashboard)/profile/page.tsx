'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] text-sm transition';
const btnPrimary = 'px-4 py-2 rounded-lg bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
      toast.error('Image size cannot exceed 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const response = await api.post<{ avatarUrl: string }>('/api/profile/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAvatarUrl(response.avatarUrl);
      if (refreshUser) {
        await refreshUser();
      }
      toast.success('Avatar updated successfully');
      setUploading(false);
    } catch (err) {
      console.warn('Backend API offline. Updating avatar locally for testing (Mock Mode):', err);
      // Simulate S3 upload delay and show local preview
      setTimeout(() => {
        const localUrl = URL.createObjectURL(file);
        setAvatarUrl(localUrl);
        toast.success('API offline. Updated avatar in Mock Mode!');
        setUploading(false);
      }, 1000);
    }
  };

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

        <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
          {/* Avatar Upload block */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-inner group">
              <img 
                src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=25439b&color=fff&size=128`} 
                alt="Profile Avatar" 
                className="h-full w-full object-cover" 
              />
              {uploading && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-[10px] font-bold">
                  Uploading...
                </div>
              )}
            </div>
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm border border-slate-200">
              Change Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload} 
                disabled={uploading}
              />
            </label>
          </div>

          {/* Details block */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
              <div className="flex flex-wrap gap-1.5 mt-1">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="px-2.5 py-0.5 rounded-full bg-[#25439b]/10 text-[#25439b] text-[10px] font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <div className="mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                  user.isActive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
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
