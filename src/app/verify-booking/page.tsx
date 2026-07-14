'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  QrCode, 
  UtensilsCrossed 
} from 'lucide-react';

interface BookingDetails {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingTime: string;
  guests: number;
  status: string;
  source: string;
  depositPaid: boolean;
  branchId: string;
  notes: string;
  tableId: number | null;
  tableLabel: string | null;
  dietaryNotes: string;
  allergyPeanut: boolean;
  allergyGluten: boolean;
  allergyOthers: string | null;
  depositAmount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  orderCode: number | null;
  durationMinutes: number;
  eventId: number | null;
  branchName?: string;
  branchAddress?: string;
  eventTitle?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventDescription?: string;
}

export default function VerifyBookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const bookingId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user has staff permissions
  const isStaff = user?.roles && user.roles.some(role => 
    ['ADMIN', 'COOPERATOR', 'MANAGER', 'CASHIER', 'EMPLOYEE', 'HR'].includes(role)
  );

  const fetchBookingDetails = async () => {
    if (!bookingId) {
      setError('Mã đặt bàn/vé sự kiện không hợp lệ.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.get<BookingDetails>(`/api/public/bookings/${bookingId}`);
      setBooking(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy thông tin đặt chỗ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const handleCheckIn = async () => {
    if (!bookingId || !booking) return;
    try {
      setCheckingIn(true);
      await api.put(`/api/pos/bookings/${bookingId}/check-in`, {});
      toast.success('Xác nhận đón khách (Check-in) thành công!');
      // Update local state
      setBooking(prev => prev ? { ...prev, status: 'CHECKED_IN' } : null);
    } catch (err: any) {
      toast.error(err.message || 'Check-in thất bại, vui lòng thử lại.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-sm">Đang tải dữ liệu xác thực...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full border border-red-100 flex items-center justify-center shadow-sm mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Lỗi xác thực</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{error || 'Không tìm thấy thông tin đặt.'}</p>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Về trang chủ
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const isEvent = booking.eventId !== null;
  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    CHECKED_IN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    CHECKED_IN: 'Đã check-in (Đón khách)',
    CANCELLED: 'Đã hủy',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-md">
          {/* Card Header Banner */}
          <div className={`p-6 text-white text-center relative overflow-hidden ${
            isEvent ? 'bg-gradient-to-r from-purple-600 to-indigo-700' : 'bg-gradient-to-r from-blue-600 to-indigo-650'
          }`}>
            <div className="absolute top-[-30%] left-[-10%] h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-[-30%] right-[-10%] h-36 w-36 rounded-full bg-white/10 blur-2xl" />
            
            <div className="relative z-10 flex flex-col items-center space-y-2">
              <div className="p-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 shadow-inner mb-1">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-lg font-black tracking-wide uppercase">
                Xác thực đặt {isEvent ? 'vé sự kiện' : 'chỗ nhà hàng'}
              </h1>
              <p className="text-white/80 text-xs font-semibold">
                Mã đặt chỗ: <span className="font-extrabold text-white text-sm">#{booking.id}</span>
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Trạng thái đặt</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border shadow-sm ${statusColors[booking.status] || 'bg-slate-50 text-slate-650'}`}>
                {statusLabels[booking.status] || booking.status}
              </span>
            </div>

            {/* Event Specific Card Details */}
            {isEvent && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-left space-y-2">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Thông tin sự kiện</p>
                <h2 className="text-sm font-black text-slate-800 leading-tight">{booking.eventTitle}</h2>
                <div className="text-xs text-slate-600 space-y-1.5 pt-1.5 border-t border-indigo-100/50">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span><strong>Ngày diễn ra:</strong> {booking.eventDate || 'Theo thông tin sự kiện'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span><strong>Thời gian:</strong> {booking.eventTime || 'Cả ngày'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span><strong>Địa điểm:</strong> {booking.eventLocation || 'Tại nhà hàng'}</span>
                  </p>
                </div>
              </div>
            )}

            {/* General Info list */}
            <div className="space-y-4 text-left">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider border-l-3 border-blue-600 pl-2">
                Thông tin khách hàng
              </h3>
              
              <div className="grid grid-cols-1 gap-3.5">
                <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100/85">
                  <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-semibold">Tên khách hàng</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{booking.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100/85">
                  <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-semibold">Số điện thoại</p>
                    <p className="text-slate-800 font-bold text-sm mt-0.5">{booking.customerPhone}</p>
                  </div>
                </div>

                {booking.customerEmail && (
                  <div className="flex items-center gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100/85">
                    <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-slate-400 font-semibold">Địa chỉ Email</p>
                      <p className="text-slate-800 font-bold text-sm mt-0.5">{booking.customerEmail}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details and table info */}
            <div className="space-y-4 text-left border-t border-slate-100 pt-5">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider border-l-3 border-blue-600 pl-2">
                Chi tiết đặt chỗ
              </h3>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150/70">
                  <p className="text-slate-400 font-bold">Số lượng</p>
                  <p className="text-slate-850 font-black text-base mt-1 flex items-baseline gap-1">
                    {booking.guests}
                    <span className="text-[10px] font-bold text-slate-450">{isEvent ? 'vé' : 'người'}</span>
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-150/70">
                  <p className="text-slate-400 font-bold">{isEvent ? 'Sự kiện' : 'Số bàn'}</p>
                  <p className="text-slate-850 font-black text-base mt-1 flex items-baseline gap-1">
                    {isEvent ? 'Vé sự kiện' : (booking.tableLabel || 'Chờ xếp bàn')}
                  </p>
                </div>

                <div className="col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-150/70 space-y-1.5">
                  <div className="flex justify-between items-center text-slate-400 font-bold">
                    <span>Thời gian đón khách</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-850 font-black text-sm">
                    <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>
                      {new Date(booking.bookingTime).toLocaleString('vi-VN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                {booking.branchName && (
                  <div className="col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-150/70 space-y-1">
                    <p className="text-slate-400 font-bold">Chi nhánh nhà hàng</p>
                    <p className="text-slate-850 font-black text-sm">{booking.branchName}</p>
                    <p className="text-slate-500 font-semibold text-[10px]">{booking.branchAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3 text-left border-t border-slate-100 pt-5">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider border-l-3 border-blue-600 pl-2">
                Thông tin thanh toán cọc
              </h3>
              
              <div className="p-4 rounded-2xl border border-slate-150/70 bg-slate-50/70 space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Số tiền cọc:</span>
                  <span className="font-extrabold text-slate-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.depositAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Trạng thái thanh toán:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                    booking.paymentStatus === 'PAID' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                      : 'bg-amber-50 text-amber-700 border-amber-150'
                  }`}>
                    {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
                {booking.paymentMethod && (
                  <div className="flex justify-between">
                    <span>Hình thức cọc:</span>
                    <span className="font-extrabold text-slate-800">{booking.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes & Allergy Warnings */}
            {(booking.notes || booking.dietaryNotes || booking.allergyPeanut || booking.allergyGluten || booking.allergyOthers) && (
              <div className="space-y-3 text-left border-t border-slate-100 pt-5">
                <h3 className="text-xs font-black text-slate-450 uppercase tracking-wider border-l-3 border-blue-600 pl-2">
                  Lưu ý & Dị ứng ăn uống
                </h3>

                <div className="space-y-2">
                  {booking.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <p className="text-slate-400 font-bold mb-0.5">Ghi chú của khách</p>
                      <p className="text-slate-700 font-medium leading-relaxed">{booking.notes}</p>
                    </div>
                  )}

                  {(booking.allergyPeanut || booking.allergyGluten || booking.allergyOthers) && (
                    <div className="p-3 bg-red-50/55 rounded-xl border border-red-100 text-xs text-red-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        <span>Cảnh báo Dị ứng nguyên:</span>
                      </p>
                      <div className="pl-5 space-y-0.5 font-semibold text-[11px]">
                        {booking.allergyPeanut && <p>• Dị ứng lạc (đậu phộng)</p>}
                        {booking.allergyGluten && <p>• Dị ứng Gluten / Bột mì</p>}
                        {booking.allergyOthers && <p>• Thành phần khác: {booking.allergyOthers}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons (Staff check-in) */}
            <div className="border-t border-slate-100 pt-6 space-y-3">
              {isStaff ? (
                booking.status === 'CHECKED_IN' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-center justify-center gap-2.5 text-emerald-800 text-xs font-bold shadow-sm">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Khách hàng này đã được xác nhận đón tiếp (Checked-in)</span>
                  </div>
                ) : booking.status === 'CANCELLED' ? (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center gap-2.5 text-slate-600 text-xs font-bold shadow-sm">
                    <XCircle className="h-5 w-5 text-slate-500 shrink-0" />
                    <span>Lịch hẹn này đã bị hủy bỏ</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white text-xs font-bold rounded-2xl transition shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    {checkingIn ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4.5 w-4.5" />
                    )}
                    XÁC NHẬN CHECK-IN (ĐÓN KHÁCH)
                  </button>
                )
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl space-y-3 text-left">
                  <div className="flex items-start gap-2.5 text-amber-850 text-xs font-semibold leading-relaxed">
                    <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Chế độ Xem trước:</strong> Đây là thông tin lịch hẹn. Vui lòng đăng nhập bằng tài khoản nhân viên nhà hàng để có thể thực hiện xác nhận đón tiếp (Check-in).
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/verify-booking?id=${bookingId}`)}`)}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Đăng nhập tài khoản nhân viên
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
