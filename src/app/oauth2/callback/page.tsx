'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { storeCredentials } from '@/lib/api';
import { toast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    
    const email = searchParams.get('email');
    const credentials = searchParams.get('credentials');
    const error = searchParams.get('error');

    if (error) {
      processedRef.current = true;
      toast.error(`Đăng nhập thất bại: ${decodeURIComponent(error)}`);
      router.push('/login');
      return;
    }

    if (email && credentials) {
      processedRef.current = true;
      storeCredentials(email, credentials);
      
      refreshUser()
        .then((user) => {
          if (user) {
            toast.success(`Chào mừng ${user.name} trở lại!`);
            // Determine where to redirect back
            const redirectUrl = localStorage.getItem('oauth_redirect') || '/booking';
            localStorage.removeItem('oauth_redirect');
            router.push(redirectUrl);
          } else {
            toast.error('Lỗi khi lấy thông tin người dùng.');
            router.push('/login');
          }
        })
        .catch(() => {
          toast.error('Có lỗi xảy ra khi xác thực.');
          router.push('/login');
        });
    }
  }, [searchParams, refreshUser, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center border border-slate-100 flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-[#25439b] animate-spin mb-4" />
        <h3 className="text-xl font-bold mb-2">Đang xử lý đăng nhập</h3>
        <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát khi chúng tôi xác thực tài khoản Google của bạn...</p>
      </div>
    </div>
  );
}
