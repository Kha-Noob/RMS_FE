'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { 
  Utensils, 
  Calendar, 
  ChevronDown, 
  Award, 
  LogOut,
  User as UserIcon,
  Building,
  Layers,
  Percent
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLanguage();

  const isStaff = user?.roles.some(r => ['ADMIN', 'MANAGER', 'CASHIER', 'KITCHEN', 'CHEF', 'HR', 'PROCUREMENT', 'WAREHOUSE', 'EMPLOYEE'].includes(r)) || false;
  const isAdmin = user?.roles.includes('ADMIN') || false;
  const isCooperator = user?.roles.includes('COOPERATOR') || false;

  const systemHref = useMemo(() => {
    if (!user) return '/';
    const roles = user.roles;
    if (roles.includes('ADMIN') || roles.includes('MANAGER') || (roles.includes('COOPERATOR') && user.isUsingSystemWeb)) return '/dashboard';
    if (roles.includes('COOPERATOR')) return '/my-restaurant';
    
    const employeeRoles = ['HR', 'CASHIER', 'KITCHEN', 'CHEF', 'WAREHOUSE', 'PROCUREMENT', 'EMPLOYEE'];
    if (roles.some(r => employeeRoles.includes(r))) return '/employees';
    
    return '/';
  }, [user]);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const t = useMemo(() => {
    return locale === 'vi' ? {
      navExplore: 'Khám phá',
      navFeed: 'Diễn đàn Review',
      navEvents: 'Sự kiện & Ưu đãi',
      navAbout: 'Về chúng tôi',
      navSys: 'Hệ thống Quản lý',
      navSignIn: 'Đăng nhập',
      navSignUp: 'Đăng ký',
      navLogout: 'Đăng xuất',
      myRestaurant: 'Nhà hàng của tôi',
      myProfile: 'Trang cá nhân',
      bookingHistory: 'Lịch sử đặt bàn',
      bookTable: 'Đặt bàn ngay',
      tenantMgmt: 'Cấp chuỗi (Tenants)',
      branchMgmt: 'Quản lý Chi nhánh'
    } : {
      navExplore: 'Explore',
      navFeed: 'Review Feed',
      navEvents: 'Events & Offers',
      navAbout: 'About Us',
      navSys: 'Management System',
      navSignIn: 'Sign In',
      navSignUp: 'Sign Up',
      navLogout: 'Log Out',
      myRestaurant: 'My Restaurant',
      myProfile: 'My Profile',
      bookingHistory: 'Booking History',
      bookTable: 'Book Table',
      tenantMgmt: 'Tenants Provision',
      branchMgmt: 'Branch Management'
    };
  }, [locale]);

  const activeCls = 'rounded-full bg-white shadow-sm px-4 py-1.5 text-sm font-bold text-blue-650 transition-all';
  const inactiveCls = 'rounded-full px-4 py-1.5 text-sm font-medium text-blue-955 hover:bg-white hover:shadow-sm transition-all';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-white/85 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-650 shadow-md group-hover:scale-105 transition-transform duration-300">
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
            className={pathname === '/' ? activeCls : inactiveCls}
          >
            {t.navExplore}
          </Link>
          <Link 
            href="/feed"
            className={pathname === '/feed' ? activeCls : inactiveCls}
          >
            {t.navFeed}
          </Link>
          <Link 
            href="/events"
            className={pathname === '/events' ? activeCls : inactiveCls}
          >
            {t.navEvents}
          </Link>
          <Link 
            href="/#about-us-section"
            className={inactiveCls}
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

          {/* Premium Book a Table CTA button */}
          <Link 
            href="/booking" 
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 hover:scale-102 active:scale-98 text-white px-4.5 py-2 text-xs font-black shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
          >
            <Calendar className="h-3.5 w-3.5 text-white" />
            <span>{t.bookTable}</span>
          </Link>

          {/* User management switch options */}
          {(isStaff || (isCooperator && user?.isUsingSystemWeb)) && (
            <Link 
              href={systemHref} 
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/40 hover:bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:scale-102 hover:shadow"
            >
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span>{t.navSys}</span>
            </Link>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-full border border-blue-100/75 transition duration-200 cursor-pointer focus:outline-none shadow-sm"
              >
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="h-6.5 w-6.5 rounded-full object-cover shadow-sm border border-blue-200/50"
                  />
                ) : (
                  <div className="h-6.5 w-6.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black uppercase shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                )}
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
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      <span>{t.myProfile}</span>
                    </Link>
                    {isAdmin && (
                      <>
                        <Link 
                          href="/admin-tenants"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Building className="h-4 w-4 text-slate-400" />
                          <span>{t.tenantMgmt}</span>
                        </Link>
                        <Link 
                          href="/admin-commissions"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <Percent className="h-4 w-4 text-slate-400" />
                          <span>{locale === 'vi' ? 'Báo cáo hoa hồng' : 'Commission Report'}</span>
                        </Link>
                      </>
                    )}
                    {isCooperator && user?.isUsingSystemWeb && (
                      <Link 
                        href="/branch-management"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Layers className="h-4 w-4 text-slate-400" />
                        <span>{t.branchMgmt}</span>
                      </Link>
                    )}
                    {(isAdmin || isCooperator) ? (
                      <Link 
                        href="/my-restaurant"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Utensils className="h-4 w-4 text-slate-400" />
                        <span>{t.myRestaurant}</span>
                      </Link>
                    ) : isStaff ? (
                      <Link 
                        href={systemHref}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Utensils className="h-4 w-4 text-slate-400" />
                        <span>{t.navSys}</span>
                      </Link>
                    ) : null}
                    {!isCooperator && (
                      <Link
                        href="/booking-history"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{t.bookingHistory}</span>
                      </Link>
                    )}
                    <div className="my-1 border-t border-slate-100" />
                    <button 
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t.navLogout}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                {t.navSignIn}
              </Link>
              <Link 
                href="/customer-portal" 
                className="rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white px-5 py-2 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-102 hover:brightness-105 active:scale-98 transition-all duration-200"
              >
                {t.navSignUp}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
