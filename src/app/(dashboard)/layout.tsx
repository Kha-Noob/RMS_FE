'use client';

import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { menuItems } from '@/config/menu';

function getDefaultLandingPage(roles: string[]): string {
  if (roles.includes('ADMIN') || roles.includes('MANAGER')) return '/dashboard';
  if (roles.includes('HR')) return '/hr-management';
  if (roles.includes('KITCHEN') || roles.includes('CHEF')) return '/kds';
  if (roles.includes('WAREHOUSE')) return '/inventory';
  if (roles.includes('PROCUREMENT')) return '/procurement';
  if (roles.includes('CASHIER')) return '/pos';
  if (roles.includes('EMPLOYEE')) return '/schedule';
  return '/profile';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const isAllowed = useMemo(() => {
    if (!user) return false;
    
    // Find the item matching the pathname prefix
    const item = menuItems.find(m => pathname.startsWith(m.href));
    if (!item) return true; // public/unmapped routes (like /profile) are allowed
    
    return user.roles.some(r => item.roles.includes(r));
  }, [user, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAllowed) {
    const defaultPage = getDefaultLandingPage(user.roles);
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl text-center flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Không có quyền truy cập</h2>
              <p className="text-slate-500 text-sm mt-2">
                Tài khoản của bạn với vai trò <strong className="text-blue-600">{user.roles.join(', ')}</strong> không có quyền truy cập trang này.
              </p>
            </div>
            <button
              onClick={() => router.push(defaultPage)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02]"
            >
              Về trang mặc định của bạn
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-6 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
