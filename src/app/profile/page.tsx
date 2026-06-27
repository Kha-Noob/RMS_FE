'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import {
  Utensils,
  LogOut,
  ChevronDown,
  Calendar,
  Award,
  Phone,
  Mail,
  User as UserIcon,
  Shield,
  Upload,
  Lock,
  KeyRound,
  Sparkles,
  CircleDollarSign,
  Heart
} from 'lucide-react';

export default function PublicProfilePage() {
  const { user, logout, refreshUser, loading } = useAuth();
  const { locale, setLocale } = useLanguage();
  const router = useRouter();

  // --- States ---
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Account Information form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [gender, setGender] = useState(user?.gender || 'OTHER');
  const [dietaryNotes, setDietaryNotes] = useState(user?.dietaryNotes || '');
  const [updatingInfo, setUpdatingInfo] = useState(false);

  // Security Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // --- Authentication Redirect Guard ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // --- Sync Avatar & Info State ---
  useEffect(() => {
    if (user) {
      setAvatarUrl(user.avatarUrl || '');
      setName(user.name || '');
      setPhone(user.phone || '');
      setBirthday(user.birthday || '');
      setGender(user.gender || 'OTHER');
      setDietaryNotes(user.dietaryNotes || '');
    }
  }, [user]);

  // --- Mock Booking History ---
  const mockBookings = useMemo(() => {
    return [
      { id: 'b-104', date: '2026-07-02', branch: 'Chi nhánh Hoàn Kiếm', guests: 4, spent: 0, status: 'Upcoming' },
      { id: 'b-103', date: '2026-06-20', branch: 'Chi nhánh Hoàn Kiếm', guests: 4, spent: 2450000, status: 'Completed' },
      { id: 'b-102', date: '2026-06-12', branch: 'Chi nhánh Hoàn Kiếm', guests: 2, spent: 1200000, status: 'Completed' },
      { id: 'b-101', date: '2026-05-28', branch: 'Chi nhánh Cầu Giấy', guests: 6, spent: 4800000, status: 'Completed' },
    ];
  }, []);

  // --- Dynamic Translations Dictionary ---
  const t = useMemo(() => {
    return locale === 'vi' ? {
      // Nav
      navExplore: 'Khám phá',
      navFeed: 'Diễn đàn Review',
      navEvents: 'Sự kiện & Ưu đãi',
      navAbout: 'Về chúng tôi',
      navSys: 'Hệ thống Quản lý',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navDashboard: 'Dashboard',
      navLogout: 'Đăng xuất',
      
      // Profile Content
      profileTitle: 'Hồ Sơ Thành Viên',
      profileSub: 'Quản lý thông tin hội viên, điểm tích lũy và lịch sử giao dịch',
      
      // Loyalty Card Tiers
      tierLabel: 'CẤP ĐỘ THÀNH VIÊN',
      tierStandard: 'THÀNH VIÊN THƯỜNG',
      tierBronze: 'THÀNH VIÊN ĐỒNG',
      tierSilver: 'THÀNH VIÊN BẠC',
      tierGold: 'THÀNH VIÊN VÀNG',
      tierPlatinum: 'THÀNH VIÊN BẠCH KIM',
      tierDiamond: 'THÀNH VIÊN KIM CƯƠNG',
      cardHolder: 'CHỦ THẺ',
      cardNumber: 'MÃ SỐ THẺ',
      ptsBalance: 'ĐIỂM TÍCH LŨY HIỆN TẠI',
      nextTierHint: 'Tích lũy thêm {pts} điểm để thăng hạng {next}',
      
      // Stats Cards
      statBookings: 'Số lần đặt bàn',
      statBookingsSub: 'Lượt đặt thành công',
      statSpent: 'Tổng chi tiêu',
      statSpentSub: 'Hóa đơn tích lũy',
      statMemberSince: 'Thành viên từ',
      statMemberSinceSub: 'Ngày gia nhập hệ thống',

      // Booking History
      bookingHistoryTitle: 'Lịch sử đặt bàn gần đây',
      btnViewAll: 'Xem tất cả',
      thDate: 'Ngày đặt',
      thBranch: 'Chi nhánh',
      thGuests: 'Số khách',
      thSpent: 'Hóa đơn',
      thStatus: 'Trạng thái',
      statusCompleted: 'Hoàn thành',
      statusUpcoming: 'Sắp diễn ra',
      statusCancelled: 'Đã hủy',
      
      // Edit Account Info
      cardInfoTitle: 'Thông tin cá nhân',
      labelName: 'Họ và tên',
      labelEmail: 'Địa chỉ Email (Không thể thay đổi)',
      labelPhone: 'Số điện thoại',
      labelBirthday: 'Ngày sinh',
      labelGender: 'Giới tính',
      genderMale: 'Nam',
      genderFemale: 'Nữ',
      genderOther: 'Khác',
      labelDietary: 'Sở thích ăn uống & Ghi chú dị ứng',
      placeholderDietary: 'Ví dụ: Ăn chay, không ăn cay, dị ứng đậu phộng, ưu tiên ngồi bàn gần cửa sổ...',
      btnChangePhoto: 'Thay ảnh',
      uploadingText: 'Đang tải...',
      btnSaveInfo: 'Lưu thay đổi',
      btnSavingInfo: 'Đang lưu...',
      
      // Password
      cardPassTitle: 'Đổi mật khẩu bảo mật',
      labelOldPass: 'Mật khẩu hiện tại',
      labelNewPass: 'Mật khẩu mới',
      labelConfirmPass: 'Xác nhận mật khẩu mới',
      passMinLengthHint: 'Mật khẩu phải dài ít nhất 6 ký tự',
      btnChangePass: 'Cập nhật mật khẩu',
      btnChangingPass: 'Đang cập nhật...',
      
      // Toast notifications
      toastSelectImage: 'Vui lòng chọn file hình ảnh',
      toastLimitSize: 'Dung lượng ảnh không được vượt quá 5MB',
      toastAvatarSuccess: 'Đã cập nhật ảnh đại diện thành công',
      toastOldPassRequired: 'Mật khẩu hiện tại không được để trống',
      toastNewPassRequired: 'Mật khẩu mới không được để trống',
      toastPassMinLength: 'Mật khẩu mới phải từ 6 ký tự trở lên',
      toastPassMismatch: 'Xác nhận mật khẩu không khớp',
      toastPassSuccess: 'Đổi mật khẩu thành công',
      toastInfoSuccess: 'Đã cập nhật thông tin cá nhân thành công',
      toastMockMode: 'API offline. Đã cập nhật ảnh ở chế độ giả lập!',
      toastMockInfoMode: 'API offline. Đã cập nhật thông tin cá nhân giả lập!',
      
      // Footer
      footerDesc: 'Kết nối những tâm hồn ẩm thực với các nhà hàng sang trọng và uy tín. Tìm kiếm, đánh giá và đặt bàn trực tuyến dễ dàng.',
      footerExplore: 'Khám phá',
      footerSearch: 'Tìm kiếm nhà hàng',
      footerCuisineCol: 'Bộ sưu tập món ăn',
      footerLatestRev: 'Đánh giá mới nhất',
      footerWeeklyOffers: 'Ưu đãi tuần này',
      footerPartner: 'Hợp tác',
      footerRegOwner: 'Đăng ký chủ nhà hàng',
      footerAdPacks: 'Gói dịch vụ quảng bá',
      footerGuide: 'Hướng dẫn đặt bàn',
      footerContact: 'Liên hệ & Kết nối',
      footerTerms: 'Điều khoản dịch vụ',
      footerPrivacy: 'Chính sách bảo mật',
      footerAllRights: 'Bảo lưu mọi quyền.'
    } : {
      // Nav
      navExplore: 'Explore',
      navFeed: 'Review Feed',
      navEvents: 'Events & Offers',
      navAbout: 'About Us',
      navSys: 'Management System',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navDashboard: 'Dashboard',
      navLogout: 'Log Out',
      
      // Profile Content
      profileTitle: 'Membership Profile',
      profileSub: 'Manage your loyalty tier, reward points, and table reservation history',
      
      // Loyalty Card Tiers
      tierLabel: 'MEMBERSHIP TIER',
      tierStandard: 'STANDARD MEMBER',
      tierBronze: 'BRONZE MEMBER',
      tierSilver: 'SILVER MEMBER',
      tierGold: 'GOLD MEMBER',
      tierPlatinum: 'PLATINUM MEMBER',
      tierDiamond: 'DIAMOND MEMBER',
      cardHolder: 'CARDHOLDER',
      cardNumber: 'CARD NUMBER',
      ptsBalance: 'CURRENT LOYALTY POINTS',
      nextTierHint: 'Accumulate {pts} more points to reach {next}',

      // Stats Cards
      statBookings: 'Total Bookings',
      statBookingsSub: 'Successful visits',
      statSpent: 'Total Spent',
      statSpentSub: 'Cumulative bills',
      statMemberSince: 'Member Since',
      statMemberSinceSub: 'Join date',

      // Booking History
      bookingHistoryTitle: 'Recent Booking History',
      btnViewAll: 'View All',
      thDate: 'Booking Date',
      thBranch: 'Branch',
      thGuests: 'Party Size',
      thSpent: 'Bill Amount',
      thStatus: 'Status',
      statusCompleted: 'Completed',
      statusUpcoming: 'Upcoming',
      statusCancelled: 'Cancelled',
      
      // Edit Account Info
      cardInfoTitle: 'Personal Information',
      labelName: 'Full Name',
      labelEmail: 'Email Address (Non-changeable)',
      labelPhone: 'Phone Number',
      labelBirthday: 'Date of Birth',
      labelGender: 'Gender',
      genderMale: 'Male',
      genderFemale: 'Female',
      genderOther: 'Other',
      labelDietary: 'Dietary Preferences & Allergy Notes',
      placeholderDietary: 'Example: Vegetarian, no spicy, peanut allergy, prefers tables near window...',
      btnChangePhoto: 'Change Photo',
      uploadingText: 'Uploading...',
      btnSaveInfo: 'Save Changes',
      btnSavingInfo: 'Saving...',
      
      // Password
      cardPassTitle: 'Change Account Password',
      labelOldPass: 'Current Password',
      labelNewPass: 'New Password',
      labelConfirmPass: 'Confirm New Password',
      passMinLengthHint: 'Must be at least 6 characters',
      btnChangePass: 'Change Password',
      btnChangingPass: 'Changing...',
      
      // Toast notifications
      toastSelectImage: 'Please select an image file',
      toastLimitSize: 'Image size cannot exceed 5MB',
      toastAvatarSuccess: 'Avatar updated successfully',
      toastOldPassRequired: 'Current password is required',
      toastNewPassRequired: 'New password is required',
      toastPassMinLength: 'New password must be at least 6 characters',
      toastPassMismatch: 'Passwords do not match',
      toastPassSuccess: 'Password changed successfully',
      toastInfoSuccess: 'Personal information updated successfully',
      toastMockMode: 'API offline. Updated avatar in Mock Mode!',
      toastMockInfoMode: 'API offline. Updated profile details locally!',
      
      // Footer
      footerDesc: 'Connecting food lovers with prestigious and luxurious restaurants. Search, review, and book tables online with ease.',
      footerExplore: 'Explore',
      footerSearch: 'Search Restaurants',
      footerCuisineCol: 'Food Collections',
      footerLatestRev: 'Latest Reviews',
      footerWeeklyOffers: 'Weekly Offers',
      footerPartner: 'Partnerships',
      footerRegOwner: 'Register Restaurant Owner',
      footerAdPacks: 'Promotional Packages',
      footerGuide: 'Booking Guide',
      footerContact: 'Contact & Connect',
      footerTerms: 'Terms of Service',
      footerPrivacy: 'Privacy Policy',
      footerAllRights: 'All rights reserved.'
    };
  }, [locale]);

  // --- Resolve Card Styles dynamically based on tier ---
  const cardStyle = useMemo(() => {
    const activeTier = user?.tier || 'STANDARD';
    const styles = {
      STANDARD: {
        bg: 'bg-gradient-to-br from-slate-650 via-slate-700 to-slate-800',
        text: 'text-slate-100',
        accentText: 'text-slate-400',
        glow: 'shadow-slate-500/10',
        badgeBg: 'bg-white/10',
        displayName: t.tierStandard
      },
      BRONZE: {
        bg: 'bg-gradient-to-br from-orange-850 via-amber-800 to-amber-950',
        text: 'text-amber-50',
        accentText: 'text-amber-355',
        glow: 'shadow-amber-900/15',
        badgeBg: 'bg-white/10',
        displayName: t.tierBronze
      },
      SILVER: {
        bg: 'bg-gradient-to-br from-slate-200 via-zinc-400 to-slate-450',
        text: 'text-slate-900',
        accentText: 'text-slate-600',
        glow: 'shadow-slate-400/10',
        badgeBg: 'bg-slate-900/10',
        displayName: t.tierSilver
      },
      GOLD: {
        bg: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600',
        text: 'text-white',
        accentText: 'text-amber-100',
        glow: 'shadow-amber-500/25',
        badgeBg: 'bg-white/20',
        displayName: t.tierGold
      },
      PLATINUM: {
        bg: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
        text: 'text-indigo-50',
        accentText: 'text-indigo-300',
        glow: 'shadow-indigo-950/30 border border-indigo-900/20',
        badgeBg: 'bg-indigo-500/25',
        displayName: t.tierPlatinum
      },
      DIAMOND: {
        bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-650',
        text: 'text-white',
        accentText: 'text-cyan-100',
        glow: 'shadow-cyan-500/30 border border-cyan-300/30',
        badgeBg: 'bg-white/25',
        displayName: t.tierDiamond
      }
    };
    return styles[activeTier as keyof typeof styles] || styles.STANDARD;
  }, [user?.tier, t]);

  // --- Currency Formatter Helper ---
  const formatCurrency = (amount: number) => {
    if (locale === 'vi') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Math.round(amount / 25000));
    }
  };

  // --- Handle Avatar S3 Upload ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t.toastSelectImage);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.toastLimitSize);
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const response = await api.post<{ avatarUrl: string }>('/api/profile/upload-avatar', formData);
      setAvatarUrl(response.avatarUrl);
      if (refreshUser) {
        await refreshUser();
      }
      toast.success(t.toastAvatarSuccess);
      setUploading(false);
    } catch (err) {
      console.warn('Backend API offline. Updating avatar locally for testing (Mock Mode):', err);
      setTimeout(() => {
        const localUrl = URL.createObjectURL(file);
        setAvatarUrl(localUrl);
        toast.success(t.toastMockMode);
        setUploading(false);
      }, 1000);
    }
  };

  // --- Handle Save Personal Info ---
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingInfo(true);
      await api.post('/api/profile/update-info', {
        name,
        phone,
        birthday,
        gender,
        dietaryNotes
      });
      if (refreshUser) {
        await refreshUser();
      }
      toast.success(t.toastInfoSuccess);
    } catch (err) {
      console.warn('Backend API offline. Saving profile details locally (Mock Mode):', err);
      setTimeout(() => {
        if (user) {
          user.name = name;
          user.phone = phone;
          user.birthday = birthday;
          user.gender = gender;
          user.dietaryNotes = dietaryNotes;
        }
        toast.success(t.toastMockInfoMode);
        setUpdatingInfo(false);
      }, 800);
    }
  };

  // --- Handle Change Password ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) { toast.error(t.toastOldPassRequired); return; }
    if (!newPassword) { toast.error(t.toastNewPassRequired); return; }
    if (newPassword.length < 6) { toast.error(t.toastPassMinLength); return; }
    if (newPassword !== confirmPassword) { toast.error(t.toastPassMismatch); return; }

    try {
      setChangingPass(true);
      await api.post('/api/auth/change-password', { oldPassword, newPassword });
      toast.success(t.toastPassSuccess);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPass(false);
    }
  };

  // Show loading screen while verifying auth redirection
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Calculate points progress to Platinum Tier (3000 pts)
  const currentPoints = user.loyaltyPoints || 0;
  const nextTierPoints = 3000;
  const pointsRemaining = Math.max(0, nextTierPoints - currentPoints);
  const progressPercent = Math.min(100, (currentPoints / nextTierPoints) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden flex flex-col justify-between">
      
      {/* 1. STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white/85 backdrop-blur-md shadow-sm">
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

          {/* Nav Items */}
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
              href="/#about-us-section"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all"
            >
              {t.navAbout}
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 bg-blue-50/75 p-0.5 rounded-full border border-blue-100 shadow-inner mr-1 shrink-0">
              <button 
                onClick={() => {
                  setLocale('vi');
                  toast.success('Đã chuyển sang Tiếng Việt');
                }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-all ${locale === 'vi' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button 
                onClick={() => {
                  setLocale('en');
                  toast.success('Switched to English');
                }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black transition-all ${locale === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Nút dẫn vào phần mềm quản lý nhà hàng */}
            <Link 
              href="/dashboard" 
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/40 hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:scale-102 hover:shadow"
            >
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span>{t.navSys}</span>
            </Link>

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
                <ChevronDown className={`h-3 w-3 text-blue-600 transition-transform duration-250 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-50 animate-fade-in-scale">
                    <Link 
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Utensils className="h-4 w-4 text-slate-400" />
                      <span>{locale === 'vi' ? 'Nhà hàng của tôi' : 'My Restaurant'}</span>
                    </Link>
                    <Link 
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition bg-slate-50"
                    >
                      <UserIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600">{locale === 'vi' ? 'Trang cá nhân' : 'My Profile'}</span>
                    </Link>
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        toast.info(locale === 'vi' ? 'Tính năng lịch sử đặt bàn đang được phát triển!' : 'Booking history feature is under development!');
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{locale === 'vi' ? 'Lịch sử đặt bàn' : 'Booking History'}</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{locale === 'vi' ? 'Đăng xuất' : 'Log Out'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. PROFILE HERO TITLE SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-indigo-50/20 to-[#F8FAFC] pt-12 pb-8">
        <div className="absolute top-[-20%] left-[-10%] h-[300px] w-[300px] rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="absolute bottom-10 right-[-10%] h-[350px] w-[350px] rounded-full bg-indigo-200/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 relative z-10 text-center space-y-3">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 bg-clip-text text-transparent">
            {t.profileTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            {t.profileSub}
          </p>
        </div>
      </section>

      {/* 3. MAIN PROFILE CONTENT & MEMBERSHIP SYSTEM */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-6 space-y-8 relative z-10">
        
        {/* MEMBERSHIP TIER CARD & POINTS METERS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-10">
          
          {/* Membership Virtual Card */}
          <div className={`relative overflow-hidden w-full max-w-sm h-52 rounded-2xl ${cardStyle.bg} p-6 ${cardStyle.text} shadow-md ${cardStyle.glow} flex flex-col justify-between group hover:shadow-lg hover:scale-[1.01] transition-all duration-300 shrink-0`}>
            {/* Glass overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" />
            
            {/* Top row */}
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-1.5">
                <div className={`h-7 w-7 rounded-lg ${cardStyle.badgeBg} flex items-center justify-center backdrop-blur-sm`}>
                  <Utensils className="h-4 w-4" />
                </div>
                <span className="font-extrabold text-sm tracking-wider">RMS MEMBER</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[9px] font-bold ${cardStyle.accentText} uppercase tracking-widest`}>{t.tierLabel}</span>
                <span className="text-xs font-black tracking-wide drop-shadow-sm flex items-center gap-0.5">
                  <Sparkles className="h-3.5 w-3.5 fill-current opacity-90" />
                  {cardStyle.displayName}
                </span>
              </div>
            </div>

            {/* Chip & Wireless */}
            <div className="flex items-center gap-4 relative z-10 my-1">
              <div className="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-100 to-amber-200 opacity-90 shadow-sm relative overflow-hidden">
                <div className="absolute inset-x-2 inset-y-1.5 border border-amber-800/20 grid grid-cols-3 gap-0.5">
                  <div className="border-r border-amber-800/10"></div>
                  <div className="border-r border-amber-800/10"></div>
                  <div></div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 opacity-60">
                <div className="h-4 w-28 bg-white/80 rounded-sm overflow-hidden flex gap-[2px] p-0.5">
                  <div className="w-[1px] bg-slate-900 h-full"></div>
                  <div className="w-[2px] bg-slate-900 h-full"></div>
                  <div className="w-[1px] bg-slate-900 h-full"></div>
                  <div className="w-[4px] bg-slate-900 h-full"></div>
                  <div className="w-[1px] bg-slate-900 h-full"></div>
                  <div className="w-[2px] bg-slate-900 h-full"></div>
                  <div className="w-[3px] bg-slate-900 h-full"></div>
                  <div className="w-[1px] bg-slate-900 h-full"></div>
                  <div className="w-[2px] bg-slate-900 h-full"></div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-end relative z-10 mt-auto">
              <div className="space-y-0.5">
                <p className={`text-[9px] ${cardStyle.accentText} uppercase font-bold tracking-wider`}>{t.cardHolder}</p>
                <p className="text-xs font-bold tracking-wide uppercase">{user.name}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className={`text-[9px] ${cardStyle.accentText} uppercase font-bold tracking-wider`}>{t.cardNumber}</p>
                <p className="text-[11px] font-mono font-bold tracking-wider">{user.loyaltyCardNo || '---'}</p>
              </div>
            </div>
          </div>

          {/* Points Progress */}
          <div className="flex-1 w-full space-y-5 text-left">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t.ptsBalance}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                    {currentPoints}
                  </span>
                  <span className="text-xs font-bold text-slate-500">PTS</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                {t.nextTierHint.replace('{pts}', String(pointsRemaining)).replace('{next}', t.tierPlatinum)}
              </span>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-indigo-650 transition-all duration-1000 shadow-inner"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
              <span>0 PTS</span>
              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-150">{t.tierGold} (1,500 pts)</span>
              <span className="text-slate-500">{t.tierPlatinum} (3,000 pts)</span>
            </div>
          </div>
        </div>

        {/* 3 STATS CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Stat 1: Bookings count */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 text-left flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full translate-x-3 -translate-y-3" />
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-650 group-hover:scale-105 transition">
              <Calendar className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statBookings}</p>
              <p className="text-2xl font-black text-slate-900">{user.bookingCount || 0}</p>
              <p className="text-[10px] font-medium text-slate-500">{t.statBookingsSub}</p>
            </div>
          </div>

          {/* Stat 2: Total Spent */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 text-left flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full translate-x-3 -translate-y-3" />
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-650 group-hover:scale-105 transition">
              <CircleDollarSign className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statSpent}</p>
              <p className="text-xl font-black text-slate-900">{formatCurrency(user.totalSpent || 0)}</p>
              <p className="text-[10px] font-medium text-slate-500">{t.statSpentSub}</p>
            </div>
          </div>

          {/* Stat 3: Member since */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 text-left flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full translate-x-3 -translate-y-3" />
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-650 group-hover:scale-105 transition">
              <Award className="h-5.5 w-5.5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.statMemberSince}</p>
              <p className="text-base font-black text-slate-900">
                {user.memberSince ? new Date(user.memberSince).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : '---'}
              </p>
              <p className="text-[10px] font-medium text-slate-500">{t.statMemberSinceSub}</p>
            </div>
          </div>
        </div>

        {/* RECENT BOOKINGS HISTORY TABLE */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-650" />
              <h2 className="text-base font-extrabold text-slate-800">{t.bookingHistoryTitle}</h2>
            </div>
            <button 
              onClick={() => toast.info(locale === 'vi' ? 'Lịch sử đặt bàn đầy đủ đang được xây dựng!' : 'Full booking history is being built!')}
              className="text-xs font-bold text-blue-650 hover:underline cursor-pointer"
            >
              {t.btnViewAll}
            </button>
          </div>

          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-1">{t.thDate}</th>
                  <th className="py-3 px-3">{t.thBranch}</th>
                  <th className="py-3 px-3 text-center">{t.thGuests}</th>
                  <th className="py-3 px-3 text-right">{t.thSpent}</th>
                  <th className="py-3 px-1 text-center">{t.thStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {mockBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-1 font-medium text-xs whitespace-nowrap">
                      {new Date(booking.date).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-3 font-semibold text-xs text-slate-900">
                      {booking.branch}
                    </td>
                    <td className="py-4 px-3 text-center text-xs font-medium">
                      {booking.guests} {locale === 'vi' ? 'khách' : 'guests'}
                    </td>
                    <td className="py-4 px-3 text-right font-bold text-xs text-slate-900">
                      {booking.spent > 0 ? formatCurrency(booking.spent) : '---'}
                    </td>
                    <td className="py-4 px-1 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wide border ${
                        booking.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : booking.status === 'Upcoming'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {booking.status === 'Completed' ? t.statusCompleted : booking.status === 'Upcoming' ? t.statusUpcoming : t.statusCancelled}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Edit Account Information & Avatar Upload */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="h-5 w-5 text-blue-650" />
            <h2 className="text-base font-extrabold text-slate-800">{t.cardInfoTitle}</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Avatar Upload Container */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="relative h-28 w-28 rounded-full overflow-hidden border-3 border-blue-50 bg-slate-50 shadow-inner group">
                <img 
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=25439b&color=fff&size=128`} 
                  alt="Profile Avatar" 
                  className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300" 
                />
                {uploading && (
                  <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-[10px] font-bold">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-white rounded-full animate-spin mb-1" />
                    <span>{t.uploadingText}</span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full transition shadow-sm border border-slate-205 flex items-center gap-1">
                <Upload className="h-3 w-3 text-slate-500" />
                <span>{t.btnChangePhoto}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Editable Profile Info Details Form */}
            <form onSubmit={handleUpdateInfo} className="flex-1 w-full text-left space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-750">{t.labelName}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                {/* Email (Disabled for safety) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">{t.labelEmail}</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-sm select-none cursor-not-allowed"
                    value={user.email}
                    disabled
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-755">{t.labelPhone}</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 0912345678"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-755">{t.labelBirthday}</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-755 mb-1.5">{t.labelGender}</label>
                  <div className="flex gap-4">
                    {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                      <label 
                        key={g} 
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                          gender === g 
                            ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={gender === g}
                          onChange={() => setGender(g)}
                          className="hidden"
                        />
                        <span>
                          {g === 'MALE' ? t.genderMale : g === 'FEMALE' ? t.genderFemale : t.genderOther}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dietary Notes */}
                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                    <label className="block text-xs font-bold text-slate-755">{t.labelDietary}</label>
                  </div>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition resize-none"
                    value={dietaryNotes}
                    onChange={e => setDietaryNotes(e.target.value)}
                    placeholder={t.placeholderDietary}
                  />
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingInfo}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-6 text-xs font-bold transition shadow-sm hover:shadow active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  {updatingInfo ? t.btnSavingInfo : t.btnSaveInfo}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card 5: Change Password Form */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="h-5 w-5 text-blue-650" />
            <h2 className="text-base font-extrabold text-slate-800">{t.cardPassTitle}</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 text-left max-w-xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">{t.labelOldPass}</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">{t.labelNewPass}</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-[10px] text-slate-400 font-medium">{t.passMinLengthHint}</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">{t.labelConfirmPass}</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={changingPass} 
                className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl py-2.5 px-5 text-xs font-bold transition shadow-sm hover:shadow active:scale-98 cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="h-4 w-4" />
                <span>{changingPass ? t.btnChangingPass : t.btnChangePass}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* 4. PLATFORM FOOTER */}
      <footer id="footer" className="bg-[#111827] text-slate-400 border-t border-slate-900 pt-16 pb-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between gap-8 pb-12 border-b border-slate-800">
            
            {/* Col 1: Platform Info */}
            <div className="max-w-xs space-y-4 text-left">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-650">
                  <Utensils className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-wider">RMS</span>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed">
                {t.footerDesc}
              </p>
            </div>

            {/* Col 2: Explore */}
            <div className="space-y-3 text-left">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerExplore}</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-white transition">{t.footerSearch}</Link></li>
                <li><button onClick={() => toast.info(locale === 'vi' ? 'Tính năng bộ sưu tập sẽ sớm ra mắt!' : 'Food collections feature coming soon!')} className="hover:text-white transition">{t.footerCuisineCol}</button></li>
                <li><Link href="/feed" className="hover:text-white transition">{t.footerLatestRev}</Link></li>
                <li><button onClick={() => toast.info(locale === 'vi' ? 'Khuyến mãi sẽ được hiển thị khi BE sẵn sàng!' : 'Offers will be displayed when Backend is ready!')} className="hover:text-white transition">{t.footerWeeklyOffers}</button></li>
              </ul>
            </div>

            {/* Col 3: Partnerships */}
            <div className="space-y-3 text-left">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerPartner}</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/login" className="hover:text-white transition">{t.footerRegOwner}</a></li>
                <li><button onClick={() => toast.info(locale === 'vi' ? 'Các gói dịch vụ tiếp thị liên kết!' : 'Affiliate marketing packages!')} className="hover:text-white transition">{t.footerAdPacks}</button></li>
                <li><Link href="/" className="hover:text-white transition">{t.footerGuide}</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact & Socials */}
            <div className="space-y-3 text-left">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.footerContact}</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                  <span>1900 1234 (24/7)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-blue-500" />
                  <span>support@rms.com</span>
                </li>
                <li className="pt-2 text-slate-500 text-[10px]">
                  Hanoi, Vietnam
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-slate-500 text-[10px]">
            <p>© {new Date().getFullYear()} RMS. {t.footerAllRights}</p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <a href="#" className="hover:underline hover:text-slate-400">{t.footerTerms}</a>
              <a href="#" className="hover:underline hover:text-slate-400">{t.footerPrivacy}</a>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
