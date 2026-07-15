'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // List of public exact pages that do not require authentication
    const publicExactPaths = [
      '/', 
      '/login', 
      '/forgot-password', 
      '/oauth2/callback', 
      '/register', 
      '/customer-portal', 
      '/feed', 
      '/events', 
      '/restaurants'
    ];
    
    // Check if the current route is a public path or dynamic tenant custom page
    const isExactPublic = publicExactPaths.includes(pathname);
    const isDynamicPublic = pathname.startsWith('/restaurant-page/');
    const isPublicPath = isExactPublic || isDynamicPublic;

    if (!loading && !user && !isPublicPath) {
      console.log(`[RouteGuard] Unauthorized access to ${pathname}, redirecting to /login`);
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Render a clean, premium loading indicator while checking auth status (e.g., during page refresh)
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#1e293b] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent shadow-md"></div>
          <div className="text-sm font-semibold tracking-wider text-slate-300 animate-pulse">
            Đang đồng bộ phiên làm việc...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
