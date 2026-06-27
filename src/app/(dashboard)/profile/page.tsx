'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Calendar } from 'lucide-react';

const inputCls = 'w-full pl-3 pr-10 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] text-sm transition';
const btnPrimary = 'px-4 py-2 rounded-lg bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // --- Live Booking History ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('18:30');
  const [editGuests, setEditGuests] = useState(2);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingBookings(true);
      const data = await api.get<any[]>('/api/public/bookings/customer', {
        params: { phone: user.phone || '', email: user.email || '' }
      });
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đặt bàn này không?')) return;
    try {
      await api.delete(`/api/public/bookings/${bookingId}`);
      toast.success('Hủy đặt bàn thành công!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi hủy đặt bàn!');
    }
  };

  const handleOpenEdit = (booking: any) => {
    setEditingBooking(booking);
    const datePart = booking.bookingTime.split('T')[0];
    const timePart = booking.bookingTime.split('T')[1].substring(0, 5);
    setEditDate(datePart);
    setEditTime(timePart);
    setEditGuests(booking.guests);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      await api.put(`/api/public/bookings/${editingBooking.id}`, {
        bookingTime: `${editDate}T${editTime}:00`,
        guests: editGuests
      });
      toast.success('Cập nhật đặt bàn thành công!');
      setEditingBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật đặt bàn!');
    }
  };

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

      {/* Live Booking History Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Calendar className="h-5 w-5 text-[#25439b]" />
          <h2 className="text-lg font-semibold text-slate-800">Lịch sử đặt bàn</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-450 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-1">Ngày hẹn</th>
                <th className="py-3 px-3">Chi nhánh</th>
                <th className="py-3 px-3 text-center">Số khách</th>
                <th className="py-3 px-3 text-right">Tiền đặt cọc</th>
                <th className="py-3 px-1 text-center">Trạng thái / Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loadingBookings ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-450 text-xs">
                    Đang tải lịch sử đặt bàn...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-450 text-xs">
                    Không có thông tin lịch sử đặt bàn.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const isUpcoming = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
                  const branchName = booking.branchId === '01-2thang9' 
                    ? 'Chi nhánh 2 Tháng 9' 
                    : booking.branchId === '11-NguyenHuuTho' 
                    ? 'Chi nhánh Nguyễn Hữu Thọ' 
                    : booking.branchId === '21-HaiPhong' 
                    ? 'Chi nhánh Hải Phòng' 
                    : booking.branchId;

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-1 font-medium text-xs whitespace-nowrap">
                        {new Date(booking.bookingTime).toLocaleString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-3 font-semibold text-xs text-slate-900">
                        {branchName} {booking.tableLabel ? `(${booking.tableLabel})` : ''}
                      </td>
                      <td className="py-4 px-3 text-center text-xs font-medium">
                        {booking.guests} khách
                      </td>
                      <td className="py-4 px-3 text-right font-bold text-xs text-slate-900">
                        {booking.depositAmount > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.depositAmount) : '---'}
                      </td>
                      <td className="py-4 px-1 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide border ${
                            booking.status === 'CHECKED_IN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : isUpcoming
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {booking.status}
                          </span>
                          {isUpcoming && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleOpenEdit(booking)}
                                className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[9px] font-bold transition"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleCancelBooking(booking.id)}
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[9px] font-bold transition"
                              >
                                Hủy
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3">Change Password</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                className={inputCls}
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 focus:outline-none cursor-pointer"
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                className={inputCls}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={inputCls}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Edit Booking Modal (US#7) */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Chỉnh sửa thông tin đặt bàn</h3>
              <p className="text-xs text-slate-500">Mã đặt bàn: RMS-BK{editingBooking.id}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Chọn ngày mới</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Chọn giờ mới</label>
                <select
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="11:00">11:00 AM</option>
                  <option value="11:30">11:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">13:00 PM</option>
                  <option value="17:00">17:00 PM</option>
                  <option value="17:30">17:30 PM</option>
                  <option value="18:00">18:00 PM</option>
                  <option value="18:30">18:30 PM</option>
                  <option value="19:00">19:00 PM</option>
                  <option value="19:30">19:30 PM</option>
                  <option value="20:00">20:00 PM</option>
                  <option value="20:30">20:30 PM</option>
                  <option value="21:00">21:00 PM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Số lượng khách</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editGuests}
                  onChange={e => setEditGuests(parseInt(e.target.value) || 2)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#25439b] hover:bg-[#1c3580] text-white font-bold text-xs rounded-xl shadow"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
