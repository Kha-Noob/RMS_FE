'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { Eye, EyeOff, Utensils, Mail, Lock, Phone, User } from 'lucide-react';
import { api } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { locale } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Partner Registration States ---
  const [isRegisterPartner, setIsRegisterPartner] = useState(false);

  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    if (searchParams.get('registerPartner') === 'true') {
      setIsRegisterPartner(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await api.get('/api/public/cooperation/packages');
        if (data) {
          setPackages(data as any[]);
          const typeFromUrl = searchParams.get('requestType');
          if (typeFromUrl) {
            setRegRequestType(typeFromUrl.toUpperCase());
          }
        }
      } catch (err) {
        console.error('Failed to load packages:', err);
      }
    };
    fetchPackages();
  }, [searchParams]);

  useEffect(() => {
    setEmail('');
    setPassword('');
  }, [isRegisterPartner]);
  const [regName, setRegName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRequestType, setRegRequestType] = useState('APP_SUBSCRIPTION');
  const [registering, setRegistering] = useState(false);

  const handleRegisterPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !email.trim() || !password.trim() || !regBusinessName.trim() || !regPhone.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập đầy đủ các thông tin bắt buộc.' : 'Please fill all required fields.');
      return;
    }
    if (!/^[A-Za-zÀ-ỹ\s']{2,100}$/.test(regName.trim())) {
      toast.error(locale === 'vi' ? 'Họ và tên không hợp lệ (chỉ chứa chữ cái, từ 2-100 ký tự).' : 'Invalid name (2-100 characters, letters only).');
      return;
    }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim())) {
      toast.error(locale === 'vi' ? 'Email không đúng định dạng.' : 'Invalid email format.');
      return;
    }
    // Password strength: min 8, 1 digit, 1 special character
    if (password.length < 8 || !/\d/.test(password) || !/[!@#$%^&*()]/.test(password)) {
      toast.error(locale === 'vi' 
        ? 'Mật khẩu phải từ 8 ký tự trở lên, chứa ít nhất 1 chữ số và 1 ký tự đặc biệt.'
        : 'Password must be at least 8 characters long, containing at least 1 digit and 1 special character.');
      return;
    }
    if (!/^(0|\+84)[35789][0-9]{8}$/.test(regPhone.trim())) {
      toast.error(locale === 'vi' ? 'Số điện thoại không đúng định dạng (phải là số điện thoại Việt Nam hợp lệ).' : 'Invalid Vietnamese phone number.');
      return;
    }
    if (regBusinessName.trim().length < 3 || regBusinessName.trim().length > 150) {
      toast.error(locale === 'vi' ? 'Tên nhà hàng/chuỗi phải từ 3 đến 150 ký tự.' : 'Business name must be 3 to 150 characters.');
      return;
    }
    setRegistering(true);
    try {
      const res = await api.post<any>('/api/public/cooperation/register', {
        name: regName,
        email: email,
        password: password,
        businessName: regBusinessName,
        contactPhone: regPhone,
        requestType: regRequestType
      });
      toast.success(res?.message || 'Đăng ký tài khoản hợp tác thành công!');
      setIsRegisterPartner(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Đăng ký tài khoản hợp tác thất bại.';
      toast.error(errMsg);
    } finally {
      setRegistering(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      toast.success(locale === 'vi' ? 'Đăng nhập thành công!' : 'Logged in successfully');
      router.push('/');
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      let userFriendlyMsg = rawMsg;
      if (
        rawMsg.toLowerCase().includes('bad credentials') || 
        rawMsg.toLowerCase().includes('unauthorized') || 
        rawMsg.toLowerCase().includes('user not found') ||
        rawMsg.toLowerCase().includes('invalid credentials')
      ) {
        userFriendlyMsg = locale === 'vi' 
          ? 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.' 
          : 'Incorrect email or password. Please check and try again.';
      }
      toast.error(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8f9fc]">
      {/* Visual Section - Left Side on Desktop */}
      <div 
        className="hidden lg:flex lg:w-7/12 relative flex-col justify-between p-12 text-white bg-cover bg-center select-none"
        style={{ backgroundImage: `url('/restaurant_login_bg.png')` }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-transparent z-0" />
        
        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-widest text-white">RMS</span>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-md space-y-5 my-auto">
          <h2 className="text-3xl font-extrabold leading-snug text-white drop-shadow-sm">
            {locale === 'vi' 
              ? 'Trải nghiệm quản lý & vận hành ẩm thực tối giản.' 
              : 'Experience seamless culinary operation & management.'}
          </h2>
          <p className="text-slate-200 text-[13px] font-medium leading-relaxed drop-shadow-sm">
            {locale === 'vi'
              ? 'Hệ thống tối ưu hóa hoàn hảo quy trình đặt bàn trực tuyến, quản lý nhân sự, kiểm soát kho và nâng tầm chất lượng dịch vụ ẩm thực chuỗi nhà hàng.'
              : 'Perfectly optimize your online booking workflows, HR operations, inventory logs, and deliver elevated dining services for your restaurant chain.'}
          </p>

          {/* Interactive Feature list or mini glass card */}
          <div className="p-4.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg flex gap-4 max-w-sm">
            <div className="h-9 w-9 rounded-xl bg-blue-500/25 flex items-center justify-center shrink-0 border border-blue-400/25">
              <span className="text-xs font-black text-blue-300">AI</span>
            </div>
            <div>
              <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider mb-0.5">
                {locale === 'vi' ? 'Hỗ trợ đặt bàn thông minh' : 'Smart Booking Assistant'}
              </h4>
              <p className="text-slate-350 text-[10px] leading-normal font-medium">
                {locale === 'vi'
                  ? 'Công nghệ AI phân tích sơ đồ trống, tối ưu hóa vị trí và gợi ý thực đơn phù hợp cho khách hàng.'
                  : 'AI analyzes floor plans, optimizes table locations, and suggests customized dishes for guests.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] text-slate-400 font-medium">
          © {new Date().getFullYear()} RMS Platform. All rights reserved. Developed with passion.
        </div>
      </div>

      {/* Form Section - Right Side on Desktop, Centered on Mobile */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 md:p-16 min-h-screen bg-slate-50">
        <div className="w-full max-w-[400px] p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] flex flex-col">
          {/* Brand Header for Mobile only */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-650 shadow-md mb-3 lg:hidden">
              <Utensils className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-650 bg-clip-text text-transparent select-none lg:hidden">
              RMS
            </h1>
            <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mt-1 select-none lg:hidden font-black">
              {locale === 'vi' ? 'Hệ thống quản lý nhà hàng' : 'Restaurant Management System'}
            </p>
          </div>

          {/* Desktop Brand Header */}
          <h3 className="hidden lg:block text-lg font-black text-slate-900 text-left w-full select-none">
            {isRegisterPartner 
              ? (locale === 'vi' ? 'Đăng ký Đối tác RMS' : 'Register as RMS Partner')
              : (locale === 'vi' ? 'Chào mừng trở lại' : 'Welcome back')
            }
          </h3>
          <p className="hidden lg:block text-slate-400 text-xs font-bold w-full mt-1 mb-4 select-none">
            {isRegisterPartner
              ? (locale === 'vi' ? 'Sở hữu giải pháp quản trị chuỗi thông minh' : 'Digitize your restaurant operations with RMS')
              : (locale === 'vi' ? 'Đăng nhập vào tài khoản của bạn' : 'Sign in to continue to your dashboard')
            }
          </p>

          <form onSubmit={isRegisterPartner ? handleRegisterPartner : handleSubmit} className="space-y-4 w-full">
            {/* Email Field */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete={isRegisterPartner ? "new-email" : "email"}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-555/20 focus:border-blue-550 focus:bg-white transition text-xs font-semibold"
                  placeholder="name@example.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                  {locale === 'vi' ? 'Mật khẩu *' : 'Password *'}
                </label>
                {!isRegisterPartner && (
                  <Link 
                    href="/forgot-password" 
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    {locale === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isRegisterPartner ? "new-password" : "current-password"}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-555/20 focus:border-blue-550 focus:bg-white transition text-xs font-semibold"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Extra Partner Fields */}
            {isRegisterPartner && (
              <div className="space-y-3 pt-2 border-t border-slate-100 animate-fade-in">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'vi' ? 'Họ và tên chủ nhà hàng *' : 'Owner Full Name *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-555/20 focus:border-blue-550 focus:bg-white transition text-xs font-semibold"
                      placeholder="Ví dụ: Nguyễn Văn A"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                {/* Restaurant Name */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'vi' ? 'Tên nhà hàng/chuỗi ẩm thực *' : 'Restaurant/Business Name *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-555/20 focus:border-blue-550 focus:bg-white transition text-xs font-semibold"
                      placeholder="Ví dụ: Lẩu Kichi Kichi"
                    />
                    <Utensils className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'vi' ? 'Số điện thoại liên hệ *' : 'Contact Phone *'}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-555/20 focus:border-blue-550 focus:bg-white transition text-xs font-semibold"
                      placeholder="Ví dụ: 0912345678"
                    />
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                {/* Package select */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === 'vi' ? 'Chọn gói dịch vụ đăng ký *' : 'Choose Package *'}
                  </label>
                  <select
                    value={regRequestType}
                    onChange={(e) => setRegRequestType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-555/20 focus:border-blue-550 focus:bg-white transition text-xs font-semibold"
                  >
                    {packages.length === 0 ? (
                      <option value="APP_SUBSCRIPTION">{locale === 'vi' ? 'Đang tải gói dịch vụ...' : 'Loading packages...'}</option>
                    ) : (
                      packages.map((pkg) => (
                        <option key={pkg.code} value={pkg.code}>
                          {locale === 'vi' ? pkg.titleVi : pkg.titleEn} ({pkg.price.toLocaleString('vi-VN')}đ)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRegisterPartner ? registering : loading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-755 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isRegisterPartner
                ? (registering ? (locale === 'vi' ? 'Đang gửi yêu cầu...' : 'Sending request...') : (locale === 'vi' ? 'Kích hoạt Dùng thử & Đăng ký' : 'Activate Free Trial & Register'))
                : (loading ? (locale === 'vi' ? 'Đang đăng nhập...' : 'Signing in...') : (locale === 'vi' ? 'Đăng nhập' : 'Sign In'))
              }
            </button>
          </form>

          {/* Toggle buttons & Google OAuth */}
          <div className="mt-4 text-center w-full">
            <button 
              type="button"
              onClick={() => setIsRegisterPartner(!isRegisterPartner)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-755 transition cursor-pointer"
            >
              {isRegisterPartner 
                ? (locale === 'vi' ? 'Đã có tài khoản đối tác? Đăng nhập' : 'Already registered? Sign In')
                : (locale === 'vi' ? 'Đăng ký Hợp tác kinh doanh & Thuê app' : 'Register Business Partner & Rent App')
              }
            </button>
          </div>

          {!isRegisterPartner && (
            <>
              {/* Or Divider */}
              <div className="mt-4 mb-3 w-full">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                      {locale === 'vi' ? 'Hoặc' : 'or'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Google Login Button */}
              <a
                href={`${API_BASE}/oauth2/authorization/google`}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm hover:bg-slate-50 hover:border-slate-300 transition duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{locale === 'vi' ? 'Tiếp tục với Google' : 'Continue with Google'}</span>
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
