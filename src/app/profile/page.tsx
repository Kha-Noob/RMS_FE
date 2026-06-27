'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Eye, 
  EyeOff, 
  Calendar, 
  User as UserIcon, 
  Utensils, 
  LogOut, 
  ChevronDown, 
  Award,
  ShieldAlert,
  Clock,
  MapPin
} from 'lucide-react';

const inputCls = 'w-full pl-3 pr-10 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition';
const btnPrimary = 'px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-750 text-white text-sm font-medium transition shadow-sm';

export default function PublicProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { locale, setLocale } = useLanguage();
  const router = useRouter();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
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

  const t = useMemo(() => {
    return locale === 'vi' ? {
      navExplore: 'Khám phá',
      navFeed: 'Diễn đàn Review',
      navEvents: 'Sự kiện & Ưu đãi',
      navAbout: 'Về chúng tôi',
      navSys: 'Hệ thống Quản lý',
      navLogout: 'Đăng xuất',
      profileTitle: 'Trang cá nhân của tôi',
      profileSub: 'Quản lý tài khoản và xem lịch sử đặt chỗ',
      accInfo: 'Thông tin tài khoản',
      fullname: 'Họ và tên',
      email: 'Email',
      roles: 'Vai trò',
      status: 'Trạng thái',
      changePhoto: 'Thay đổi ảnh',
      bookingHistory: 'Lịch sử đặt bàn của bạn',
      colDate: 'Ngày hẹn',
      colBranch: 'Chi nhánh & Bàn',
      colGuests: 'Số khách',
      colDeposit: 'Tiền đặt cọc',
      colActions: 'Trạng thái / Thao tác',
      emptyBookings: 'Bạn chưa có lượt đặt bàn nào.',
      changePass: 'Đổi mật khẩu',
      currPass: 'Mật khẩu hiện tại',
      newPass: 'Mật khẩu mới',
      confirmNewPass: 'Xác nhận mật khẩu mới',
      btnSavePass: 'Cập nhật mật khẩu',
      passMinLength: 'Mật khẩu phải từ 6 ký tự trở lên',
      savePassSuccess: 'Đổi mật khẩu thành công!',
      avatarSuccess: 'Cập nhật ảnh đại diện thành công!',
      cancelSuccess: 'Hủy đặt bàn thành công!',
      editSuccess: 'Cập nhật đặt bàn thành công!'
    } : {
      navExplore: 'Explore',
      navFeed: 'Review Feed',
      navEvents: 'Events & Offers',
      navAbout: 'About Us',
      navSys: 'Management System',
      navLogout: 'Logout',
      profileTitle: 'My Profile',
      profileSub: 'Manage your account and view booking history',
      accInfo: 'Account Information',
      fullname: 'Full Name',
      email: 'Email',
      roles: 'Roles',
      status: 'Status',
      changePhoto: 'Change Photo',
      bookingHistory: 'Your Booking History',
      colDate: 'Date & Time',
      colBranch: 'Branch & Table',
      colGuests: 'Guests',
      colDeposit: 'Deposit Paid',
      colActions: 'Status / Actions',
      emptyBookings: 'No booking history found.',
      changePass: 'Change Password',
      currPass: 'Current Password',
      newPass: 'New Password',
      confirmNewPass: 'Confirm New Password',
      btnSavePass: 'Change Password',
      passMinLength: 'Must be at least 6 characters',
      savePassSuccess: 'Password changed successfully!',
      avatarSuccess: 'Avatar updated successfully!',
      cancelSuccess: 'Booking cancelled successfully!',
      editSuccess: 'Booking updated successfully!'
    };
  }, [locale]);

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

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
    }
  }, [user?.avatarUrl]);

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm(locale === 'vi' ? 'Bạn có chắc chắn muốn hủy đặt bàn này không?' : 'Are you sure you want to cancel this booking?')) return;
    try {
      await api.delete(`/api/public/bookings/${bookingId}`);
      toast.success(t.cancelSuccess);
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
      toast.success(t.editSuccess);
      setEditingBooking(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật đặt bàn!');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
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
      toast.success(t.avatarSuccess);
      setUploading(false);
    } catch (err) {
      console.warn('Backend API offline. Updating avatar locally for testing (Mock Mode):', err);
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
    if (!oldPassword) { toast.error(locale === 'vi' ? 'Mật khẩu hiện tại là bắt buộc' : 'Current password is required'); return; }
    if (!newPassword) { toast.error(locale === 'vi' ? 'Mật khẩu mới là bắt buộc' : 'New password is required'); return; }
    if (newPassword.length < 6) { toast.error(t.passMinLength); return; }
    if (newPassword !== confirmPassword) { toast.error(locale === 'vi' ? 'Mật khẩu xác nhận không trùng khớp' : 'Passwords do not match'); return; }

    try {
      setLoading(true);
      await api.post('/api/auth/change-password', { oldPassword, newPassword });
      toast.success(t.savePassSuccess);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logout();
      router.push('/');
      toast.success(locale === 'vi' ? 'Đã đăng xuất thành công!' : 'Logged out successfully!');
    } catch {
      router.push('/');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="text-center space-y-4">
          <Utensils className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col justify-between">
      
      {/* 1. STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-45 w-full border-b border-blue-100 bg-white/85 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-md group-hover:scale-105 transition-transform duration-300">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RMS
            </span>
          </Link>

          {/* Nav Items - Pill shaped */}
          <nav className="hidden md:flex items-center gap-1.5 bg-blue-50/50 p-1 rounded-full border border-blue-100/50">
            <Link 
              href="/"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navExplore}
            </Link>
            <Link 
              href="/feed"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navFeed}
            </Link>
            <Link 
              href="/events"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navEvents}
            </Link>
            <Link 
              href="/booking"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {locale === 'vi' ? 'Đặt bàn ngay' : 'Book Table'}
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 bg-blue-50/75 p-0.5 rounded-full border border-blue-100 shadow-inner mr-1 shrink-0">
              <button 
                onClick={() => { setLocale('vi'); toast.success('Đã chuyển sang Tiếng Việt'); }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-all ${locale === 'vi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button 
                onClick={() => { setLocale('en'); toast.success('Switched to English'); }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-all ${locale === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Premium Book a Table CTA button */}
            <Link 
              href="/booking" 
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 hover:scale-102 active:scale-98 text-white px-4.5 py-2 text-xs font-black shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
            >
              <Calendar className="h-3.5 w-3.5 text-white" />
              <span>{locale === 'vi' ? 'Đặt bàn ngay' : 'Book Table'}</span>
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-full border border-blue-100/75 transition duration-200 cursor-pointer focus:outline-none shadow-sm"
              >
                <div className="h-6.5 w-6.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black uppercase shadow-sm">
                  {user.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-blue-900 hidden sm:inline max-w-[120px] truncate select-none">
                  {user.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-blue-600 hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-100 py-1.5 shadow-lg ring-1 ring-black/5 z-55 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-xs font-extrabold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <Award className="h-3.5 w-3.5 text-slate-400" />
                    {t.navSys}
                  </Link>
                  <button
                    onClick={() => { setUserDropdownOpen(false); handleLogoutClick(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50/50 transition text-left cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-500" />
                    {t.navLogout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 flex-1 w-full space-y-8">
        
        {/* Page Title Header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            {t.profileTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {t.profileSub}
          </p>
        </div>

        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Account Details (1/3 width) */}
          <div className="space-y-6 lg:col-span-1">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">
                {t.accInfo}
              </h2>

              <div className="flex flex-col items-center gap-4 text-center">
                {/* Avatar Upload */}
                <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white bg-slate-50 shadow-md group">
                  <img 
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=25439b&color=fff&size=128`} 
                    alt="Profile Avatar" 
                    className="h-full w-full object-cover" 
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold">
                      Uploading...
                    </div>
                  )}
                </div>

                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-extrabold px-4 py-2 rounded-full transition shadow-inner border border-blue-200/50">
                  {t.changePhoto}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarUpload} 
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Data list */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-slate-50 pb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t.fullname}</label>
                  <p className="text-slate-850 text-xs font-semibold">{user.name}</p>
                </div>
                <div className="border-b border-slate-50 pb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t.email}</label>
                  <p className="text-slate-850 text-xs font-semibold truncate">{user.email}</p>
                </div>
                {user.phone && (
                  <div className="border-b border-slate-50 pb-3">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Số điện thoại</label>
                    <p className="text-slate-850 text-xs font-semibold">{user.phone}</p>
                  </div>
                )}
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t.roles}</label>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {user.roles.map((role) => (
                        <span key={role} className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t.status}</label>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Booking History & Password Change (2/3 width) */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* 2.1 Live Booking History */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">
                  {t.bookingHistory}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-1">{t.colDate}</th>
                      <th className="py-2.5 px-2">{t.colBranch}</th>
                      <th className="py-2.5 px-2 text-center">{t.colGuests}</th>
                      <th className="py-2.5 px-2 text-right">{t.colDeposit}</th>
                      <th className="py-2.5 px-1 text-center">{t.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {loadingBookings ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Đang tải lịch sử đặt bàn...
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          {t.emptyBookings}
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
                          <tr key={booking.id} className="hover:bg-slate-50/20 transition">
                            <td className="py-3.5 px-1 font-semibold whitespace-nowrap text-slate-900">
                              {new Date(booking.bookingTime).toLocaleString('vi-VN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3.5 px-2 font-medium">
                              <span className="text-slate-800 block font-semibold">{branchName}</span>
                              {booking.tableLabel && (
                                <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block border border-slate-200/50">
                                  Bàn {booking.tableLabel}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-2 text-center font-semibold">
                              {booking.guests} khách
                            </td>
                            <td className="py-3.5 px-2 text-right font-black text-slate-900">
                              {booking.depositAmount > 0 
                                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.depositAmount) 
                                : '---'}
                            </td>
                            <td className="py-3.5 px-1 text-center">
                              <div className="flex flex-col items-center gap-1.5">
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
                                      className="px-2 py-0.5 bg-blue-550 hover:bg-blue-600 text-white rounded text-[9px] font-black transition shadow-sm"
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      onClick={() => handleCancelBooking(booking.id)}
                                      className="px-2 py-0.5 bg-rose-550 hover:bg-rose-600 text-white rounded text-[9px] font-black transition shadow-sm"
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

            {/* 2.2 Change Password Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-slate-800 border-b border-slate-55 pb-3">
                {t.changePass}
              </h2>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-650 mb-1">{t.currPass}</label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-650 mb-1">{t.newPass}</label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{t.passMinLength}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-650 mb-1">{t.confirmNewPass}</label>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={loading} className={btnPrimary}>
                    {loading ? '...' : t.btnSavePass}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-center text-xs mt-16 w-full">
        <p>© 2026 RMS Platform. Bảo lưu mọi quyền.</p>
      </footer>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Chọn giờ mới</label>
                <select
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
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
