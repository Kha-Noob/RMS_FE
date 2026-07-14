'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password/request', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password/verify', { email, otp });
      toast.success('OTP verified');
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8 || !/\d/.test(newPassword) || !/[!@#$%^&*()]/.test(newPassword)) {
      toast.error('Mật khẩu mới không đủ mạnh (tối thiểu 8 ký tự, gồm 1 chữ số và 1 ký tự đặc biệt)!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password/reset', { email, otp, newPassword });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-lg">
        <Link href="/login" className="text-sm text-slate-400 hover:text-[#25439b] transition mb-6 inline-block">
          &larr; Back to login
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h1>
        <p className="text-slate-500 mb-8">
          {step === 1 && 'Enter your email to receive a verification code.'}
          {step === 2 && 'Enter the OTP sent to your email.'}
          {step === 3 && 'Enter your new password.'}
        </p>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[#25439b]' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] transition"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#25439b] hover:bg-[#1c3580] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] transition tracking-widest text-center text-lg"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#25439b] hover:bg-[#1c3580] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] transition"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]/20 focus:border-[#25439b] transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#25439b] hover:bg-[#1c3580] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
