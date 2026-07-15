'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Calendar,
  Utensils,
  Ticket,
  Search,
  Filter,
  MapPin,
  ChevronLeft,
  Clock,
  ArrowRight,
  ShoppingCart,
  Plus,
  Minus,
  CreditCard
} from 'lucide-react';

export default function BookingHistoryPage() {
  const { user, loading } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  // --- Live Booking History States ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('18:30');
  const [editGuests, setEditGuests] = useState(2);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, TABLE, EVENT
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UPCOMING, COMPLETED, CANCELLED

  // Pre-Order States for Editing Modal
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [editCart, setEditCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [menuSearch, setMenuSearch] = useState('');
  const [paymentBooking, setPaymentBooking] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    api.get<any[]>('/api/public/branches')
      .then(data => setBranches(data || []))
      .catch(err => console.error("Failed to load branches", err));
  }, []);

  // --- Authentication Redirect Guard ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // --- Fetch Booking History ---
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
    if (user) {
      fetchBookings();
    }
  }, [user, fetchBookings]);

  // --- Filter Logic ---
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Filter by Type
      if (typeFilter === 'TABLE' && b.eventId != null) return false;
      if (typeFilter === 'EVENT' && b.eventId == null) return false;

      // 2. Filter by Status
      if (statusFilter === 'UPCOMING') {
        if (b.status !== 'PENDING' && b.status !== 'CONFIRMED') return false;
      } else if (statusFilter === 'COMPLETED') {
        if (b.status !== 'CHECKED_IN' && b.status !== 'COMPLETED') return false;
      } else if (statusFilter === 'CANCELLED') {
        if (b.status !== 'CANCELLED' && b.status !== 'NO_SHOW') return false;
      }

      // 3. Filter by Search Term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const eventTitle = (b.eventTitle || '').toLowerCase();
        const branchName = (b.branchName || '').toLowerCase();
        const branchAddress = (b.branchAddress || '').toLowerCase();
        const eventLocation = (b.eventLocation || '').toLowerCase();
        const notes = (b.notes || '').toLowerCase();
        const tableLabel = (b.tableLabel || '').toLowerCase();
        const dateStr = b.bookingTime ? new Date(b.bookingTime).toLocaleDateString().toLowerCase() : '';

        let localBranchName = '';
        if (b.branchId === '01-2thang9') localBranchName = 'chi nhánh 2 tháng 9';
        else if (b.branchId === '11-nguyenhuutho') localBranchName = 'chi nhánh nguyễn hữu thọ';
        else if (b.branchId === '21-haiphong') localBranchName = 'chi nhánh hải phòng';

        const matchesQuery = 
          eventTitle.includes(query) ||
          branchName.includes(query) ||
          localBranchName.includes(query) ||
          branchAddress.includes(query) ||
          eventLocation.includes(query) ||
          notes.includes(query) ||
          tableLabel.includes(query) ||
          dateStr.includes(query);

        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [bookings, typeFilter, statusFilter, searchTerm]);

  // --- Handlers ---
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm(locale === 'vi' ? 'Bạn có chắc chắn muốn hủy đặt bàn này không?' : 'Are you sure you want to cancel this booking?')) return;
    try {
      await api.delete(`/api/public/bookings/${bookingId}`);
      toast.success(locale === 'vi' ? 'Hủy đặt bàn thành công!' : 'Booking cancelled successfully!');
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || (locale === 'vi' ? 'Lỗi khi hủy đặt bàn!' : 'Failed to cancel booking!'));
    }
  };

  const getVietQrBankId = (bankName: string) => {
    const name = bankName.toLowerCase().trim();
    if (name.includes('vietcombank') || name.includes('vcb')) return 'vietcombank';
    if (name.includes('techcombank') || name.includes('tcb')) return 'techcombank';
    if (name.includes('vietinbank') || name.includes('ctg')) return 'vietinbank';
    if (name.includes('bidv')) return 'bidv';
    if (name.includes('agribank')) return 'agribank';
    if (name.includes('mbbank') || name.includes('mb bank') || name.includes('mb')) return 'mb';
    if (name.includes('acb')) return 'acb';
    if (name.includes('tpbank') || name.includes('tp bank')) return 'tpbank';
    if (name.includes('vpbank') || name.includes('vp bank')) return 'vpbank';
    if (name.includes('sacombank')) return 'sacombank';
    if (name.includes('hdbank')) return 'hdbank';
    if (name.includes('shb')) return 'shb';
    if (name.includes('vib')) return 'vib';
    if (name.includes('eximbank')) return 'eximbank';
    if (name.includes('ocb')) return 'ocb';
    if (name.includes('scb')) return 'scb';
    return name.replace(/\s+/g, '');
  };

  const handleOpenEdit = (booking: any) => {
    setEditingBooking(booking);
    setPaymentBooking(null); // Reset payment state
    const datePart = booking.bookingTime.split('T')[0];
    const timePart = booking.bookingTime.split('T')[1].substring(0, 5);
    setEditDate(datePart);
    setEditTime(timePart);
    setEditGuests(booking.guests);

    // Load pre-ordered items
    let initialCart = [];
    if (booking.orderedItemsJson) {
      try {
        initialCart = JSON.parse(booking.orderedItemsJson);
      } catch (e) {
        console.error("Failed to parse ordered items", e);
      }
    }
    setEditCart(initialCart);

    // Fetch branch menu
    if (booking.branchId) {
      setLoadingMenu(true);
      api.get(`/api/public/branches/${booking.branchId}/menu`)
        .then((menu: any) => {
          setMenuItems(menu || []);
        })
        .catch((err: any) => {
          console.error("Failed to fetch menu", err);
          setMenuItems([]);
        })
        .finally(() => {
          setLoadingMenu(false);
        });
    } else {
      setMenuItems([]);
    }
  };

  const handleAddCart = (variant: any, pName: string) => {
    setEditCart(prev => {
      const idx = prev.findIndex(item => item.variantId === variant.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          variantId: variant.id,
          name: variant.name,
          price: variant.price,
          quantity: 1,
          productName: pName
        }];
      }
    });
  };

  const handleUpdateCartQty = (variantId: number, diff: number) => {
    setEditCart(prev => {
      const idx = prev.findIndex(item => item.variantId === variantId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx].quantity += diff;
      if (updated[idx].quantity <= 0) {
        updated.splice(idx, 1);
      }
      return updated;
    });
  };

  const cartTotal = useMemo(() => {
    return editCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [editCart]);

  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add(locale === 'vi' ? 'Tất cả' : 'All');
    menuItems.forEach(item => {
      if (item.categoryName) list.add(item.categoryName);
    });
    return Array.from(list);
  }, [menuItems, locale]);

  const filteredMenuItems = useMemo(() => {
    let items = menuItems;
    if (selectedCategory !== 'Tất cả' && selectedCategory !== 'All') {
      items = items.filter(item => item.categoryName === selectedCategory);
    }
    if (menuSearch.trim() !== '') {
      const query = menuSearch.toLowerCase();
      items = items.filter(item => item.name.toLowerCase().includes(query));
    }
    return items;
  }, [menuItems, selectedCategory, menuSearch]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      const res: any = await api.put(`/api/public/bookings/${editingBooking.id}`, {
        bookingTime: `${editDate}T${editTime}:00`,
        guests: editGuests,
        orderedItemsJson: editCart.length > 0 ? JSON.stringify(editCart) : ""
      });
      
      // If the updated booking has a payment URL and is unpaid
      if (res && res.checkoutUrl && !res.depositPaid) {
        setPaymentBooking(res);
        toast.success(locale === 'vi' ? 'Cập nhật thành công! Vui lòng thanh toán cọc.' : 'Updated successfully! Please complete deposit payment.');
      } else {
        toast.success(locale === 'vi' ? 'Cập nhật đặt bàn thành công!' : 'Booking updated successfully!');
        setEditingBooking(null);
        fetchBookings();
      }
    } catch (err: any) {
      toast.error(err.message || (locale === 'vi' ? 'Lỗi khi cập nhật đặt bàn!' : 'Failed to update booking!'));
    }
  };

  // --- Currency Formatter Helper ---
  const formatCurrency = (amount: number) => {
    if (locale === 'vi') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Math.round(amount / 25000));
    }
  };

  // --- Translations ---
  const t = useMemo(() => {
    return locale === 'vi' ? {
      title: 'Lịch sử đặt chỗ & Vé sự kiện',
      subtitle: 'Xem, tìm kiếm, lọc và cập nhật các đơn đặt bàn hoặc sự kiện đã đặt',
      backHome: 'Quay lại Trang chủ',
      thDate: 'Thời gian',
      thBranch: 'Sự kiện / Chi nhánh',
      thGuests: 'Số khách',
      thSpent: 'Tiền cọc',
      thStatus: 'Trạng thái',
      statusCompleted: 'Hoàn thành',
      statusUpcoming: 'Sắp diễn ra',
      statusCancelled: 'Đã hủy',
      thType: 'Loại',
      typeTable: 'Đặt bàn',
      typeEvent: 'Vé sự kiện',
      thLocation: 'Địa điểm',
      searchPlaceholder: 'Tìm theo tên event, nhà hàng, địa điểm...',
      filterAll: 'Tất cả trạng thái',
      filterAllTypes: 'Tất cả loại hình',
      noBookingsFound: 'Không tìm thấy lịch sử đặt bàn hoặc đặt vé.',
      editModalTitle: 'Chỉnh sửa thông tin đặt bàn',
      bookingIdLabel: 'Mã đặt bàn',
      btnCancel: 'Hủy bỏ',
      btnSave: 'Lưu thay đổi',
      labelNewDate: 'Chọn ngày mới',
      labelNewTime: 'Chọn giờ mới',
      labelGuests: 'Số lượng khách'
    } : {
      title: 'Booking & Event Tickets History',
      subtitle: 'View, search, filter, and update your reservations or event bookings',
      backHome: 'Back to Home',
      thDate: 'Time',
      thBranch: 'Event / Branch',
      thGuests: 'Party Size',
      thSpent: 'Deposit',
      thStatus: 'Status',
      statusCompleted: 'Completed',
      statusUpcoming: 'Upcoming',
      statusCancelled: 'Cancelled',
      thType: 'Type',
      typeTable: 'Table Reservation',
      typeEvent: 'Event Ticket',
      thLocation: 'Location',
      searchPlaceholder: 'Search by event name, restaurant, address...',
      filterAll: 'All statuses',
      filterAllTypes: 'All types',
      noBookingsFound: 'No booking or ticket history found.',
      editModalTitle: 'Edit Table Reservation',
      bookingIdLabel: 'Booking ID',
      btnCancel: 'Cancel',
      btnSave: 'Save changes',
      labelNewDate: 'Select new date',
      labelNewTime: 'Select new time',
      labelGuests: 'Number of guests'
    };
  }, [locale]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f8f9fc]">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-650 rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fc]">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Header Title */}
        <div className="flex flex-col gap-3 text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-650 transition cursor-pointer self-start"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{t.backHome}</span>
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.title}</h1>
            <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
          </div>
        </div>

        {/* BOOKINGS HISTORY CARD CONTAINER */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="booking-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 rounded-xl text-xs transition"
              />
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex gap-2">
              {/* Type Filter */}
              <div className="relative flex items-center flex-1 md:flex-none">
                <span className="absolute left-3 text-slate-400 pointer-events-none">
                  <Filter className="h-3 w-3" />
                </span>
                <select
                  id="booking-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full md:w-auto pl-8 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:bg-white text-slate-700 font-bold focus:outline-none rounded-xl text-[11px] appearance-none cursor-pointer transition"
                >
                  <option value="ALL">{t.filterAllTypes}</option>
                  <option value="TABLE">{t.typeTable}</option>
                  <option value="EVENT">{t.typeEvent}</option>
                </select>
                <div className="absolute right-3.5 pointer-events-none border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] border-t-slate-500"></div>
              </div>

              {/* Status Filter */}
              <div className="relative flex items-center flex-1 md:flex-none">
                <span className="absolute left-3 text-slate-400 pointer-events-none">
                  <Filter className="h-3 w-3" />
                </span>
                <select
                  id="booking-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-auto pl-8 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 focus:bg-white text-slate-700 font-bold focus:outline-none rounded-xl text-[11px] appearance-none cursor-pointer transition"
                >
                  <option value="ALL">{t.filterAll}</option>
                  <option value="UPCOMING">{t.statusUpcoming}</option>
                  <option value="COMPLETED">{t.statusCompleted}</option>
                  <option value="CANCELLED">{t.statusCancelled}</option>
                </select>
                <div className="absolute right-3.5 pointer-events-none border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4px] border-t-slate-500"></div>
              </div>
            </div>
          </div>

          {/* TABLE DISPLAY */}
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full text-sm text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-1">{t.thType}</th>
                  <th className="py-3 px-2">{t.thDate}</th>
                  <th className="py-3 px-3">{t.thBranch}</th>
                  <th className="py-3 px-3">{t.thLocation}</th>
                  <th className="py-3 px-3 text-center">{t.thGuests}</th>
                  <th className="py-3 px-3 text-right">{t.thSpent}</th>
                  <th className="py-3 px-1 text-center">{t.thStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105 text-slate-700">
                {loadingBookings ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-slate-250 border-t-blue-650 rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading history...</span>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                      {t.noBookingsFound}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const isUpcoming = booking.status === 'PENDING' || booking.status === 'CONFIRMED';
                    const isEvent = booking.eventId != null;
                    
                    const branchName = booking.branchName 
                      ? booking.branchName
                      : booking.branchId === '01-2thang9' 
                      ? 'Chi nhánh 2 Tháng 9' 
                      : booking.branchId === '11-NguyenHuuTho' 
                      ? 'Chi nhánh Nguyễn Hữu Thọ' 
                      : booking.branchId === '21-HaiPhong' 
                      ? 'Chi nhánh Hải Phòng' 
                      : booking.branchId;

                    const location = isEvent 
                      ? (booking.eventLocation || booking.branchAddress || 'Địa chỉ sự kiện')
                      : (booking.branchAddress || 'Địa chỉ đang cập nhật');

                    return (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition">
                        {/* Type Badge */}
                        <td className="py-4 px-1 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border ${
                            isEvent
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-150'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                          }`}>
                            {isEvent ? (
                              <>
                                <Ticket className="h-3 w-3" />
                                {t.typeEvent}
                              </>
                            ) : (
                              <>
                                <Utensils className="h-3 w-3" />
                                {t.typeTable}
                              </>
                            )}
                          </span>
                        </td>

                        {/* Booking Time */}
                        <td className="py-4 px-2 font-medium text-xs whitespace-nowrap">
                          {new Date(booking.bookingTime).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Event Name / Branch Name */}
                        <td className="py-4 px-3 text-left">
                          {isEvent ? (
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-xs text-indigo-950">
                                {booking.eventTitle || 'Sự kiện'}
                              </p>
                              <p className="text-[10px] text-slate-500 font-semibold">
                                {branchName}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-xs text-slate-900">
                                {branchName}
                              </p>
                              {booking.tableLabel && (
                                <p className="text-[10px] text-slate-500 font-semibold">
                                  Bàn: {booking.tableLabel}
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-4 px-3 text-left text-xs max-w-[200px] truncate" title={location}>
                          <div className="flex items-center gap-1 text-slate-500 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{location}</span>
                          </div>
                        </td>

                        {/* Guests count */}
                        <td className="py-4 px-3 text-center text-xs font-semibold text-slate-800">
                          {booking.guests} {locale === 'vi' ? 'khách' : 'guests'}
                        </td>

                        {/* Price / Deposit */}
                        <td className="py-4 px-3 text-right font-bold text-xs text-slate-900">
                          {booking.depositAmount > 0 ? formatCurrency(booking.depositAmount) : '---'}
                        </td>

                        {/* Status & Actions */}
                        <td className="py-4 px-1 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide border ${
                              booking.status === 'CHECKED_IN' || booking.status === 'COMPLETED'
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
                                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[9px] font-bold transition cursor-pointer"
                                >
                                  {locale === 'vi' ? 'Sửa' : 'Edit'}
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[9px] font-bold transition cursor-pointer"
                                >
                                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
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
      </main>

      {/* Edit Booking Modal (US#7) */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {paymentBooking ? (
            /* PAYMENT STEP IF ADDING FOOD REQUIRES DEPOSIT */
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4 flex flex-col items-center text-center">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {locale === 'vi' ? 'Thanh toán cọc đặt món' : 'Deposit Prepayment'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {locale === 'vi'
                    ? 'Bạn đã chọn thêm món ăn trước. Vui lòng thanh toán cọc 100.000đ để hoàn tất.'
                    : 'You added pre-ordered dishes. Please pay a deposit of 100,000 VND to complete.'}
                </p>
              </div>

              {(() => {
                const branchObj = branches.find(b => b.branchId === editingBooking.branchId);
                const bankId = branchObj ? getVietQrBankId(branchObj.bankName || '') : 'mbbank';
                const accNo = branchObj ? branchObj.bankAccountNo : '123456789';
                const accName = branchObj ? branchObj.bankAccountName : 'LITEFLOW RESTAURANT';
                const addInfo = `DC ${paymentBooking.customerName ? paymentBooking.customerName.toUpperCase() : ''} ${paymentBooking.customerPhone || ''}`;
                const qrUrl = `https://img.vietqr.io/image/${bankId}-${accNo}-compact.png?amount=100000&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(accName)}`;

                return (
                  <div className="w-full space-y-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-1.5 border border-slate-100">
                      <div><span className="text-slate-400 font-bold">{locale === 'vi' ? 'Ngân hàng:' : 'Bank:'}</span> <span className="font-extrabold text-slate-800">{branchObj?.bankName || 'MB Bank'}</span></div>
                      <div><span className="text-slate-400 font-bold">{locale === 'vi' ? 'Số tài khoản:' : 'Account No:'}</span> <span className="font-black text-indigo-700 select-all">{accNo}</span></div>
                      <div><span className="text-slate-400 font-bold">{locale === 'vi' ? 'Chủ tài khoản:' : 'Holder:'}</span> <span className="font-extrabold text-slate-800 uppercase">{accName}</span></div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-dashed border-indigo-200 gap-1 shadow-inner">
                      <img src={qrUrl} alt="VietQR Payment Code" className="w-40 h-40 object-contain rounded-lg border border-slate-100 shadow-sm" />
                      <p className="text-[9px] text-rose-500 font-black animate-pulse">
                        {locale === 'vi' ? '* Vui lòng giữ nguyên số tiền và nội dung khi quét' : '* Please keep the exact amount and info when scanning'}
                      </p>
                    </div>

                    {paymentBooking.checkoutUrl && (
                      <a
                        href={paymentBooking.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        💳 {locale === 'vi' ? 'Thanh toán tự động qua PayOS' : 'Pay Automatically via PayOS'}
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.post('/api/public/webhook/banking', {
                            error: 0,
                            data: [
                              {
                                description: `DC ${paymentBooking.id}`,
                                amount: 100000,
                                when: new Date().toISOString()
                              }
                            ]
                          });
                          toast.success(locale === 'vi' ? 'Giả lập thanh toán cọc thành công!' : 'Simulated deposit payment successfully!');
                          setEditingBooking(null);
                          setPaymentBooking(null);
                          fetchBookings();
                        } catch (err) {
                          toast.error('Simulation failed');
                        }
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg text-xs font-black transition shadow-sm cursor-pointer animate-pulse"
                    >
                      ⚡ {locale === 'vi' ? 'Giả lập Banking tự động nhận diện' : 'Simulate Auto-Banking Webhook'}
                    </button>
                  </div>
                );
              })()}

              <div className="pt-2 w-full border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBooking(null);
                    setPaymentBooking(null);
                    fetchBookings();
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg"
                >
                  {locale === 'vi' ? 'Đóng và kiểm tra sau' : 'Close and check later'}
                </button>
              </div>
            </div>
          ) : (
            /* FORM AND MENU GRID STEP */
            <div className="bg-white rounded-2xl p-6 max-w-4xl w-full border border-slate-200 shadow-xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
              {/* Left Column: Booking Info & Selected Items Cart */}
              <div className="flex-1 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{t.editModalTitle}</h3>
                    <p className="text-xs text-slate-500">{t.bookingIdLabel}: RMS-BK{editingBooking.id}</p>
                  </div>

                  <form onSubmit={handleSaveEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">{t.labelNewDate}</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={editDate}
                          onChange={e => setEditDate(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">{t.labelNewTime}</label>
                        <select
                          value={editTime}
                          onChange={e => setEditTime(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold"
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
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">{t.labelGuests}</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={editGuests}
                        onChange={e => setEditGuests(parseInt(e.target.value) || 2)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-semibold"
                      />
                    </div>

                    {/* Pre-order Cart Summary */}
                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-blue-600" />
                          {locale === 'vi' ? 'Món ăn đã chọn' : 'Selected Dishes'}
                        </span>
                        <span className="text-xs font-black text-blue-700">{formatCurrency(cartTotal)}</span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {editCart.length === 0 ? (
                          <p className="text-[10px] text-slate-400 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                            {locale === 'vi'
                              ? 'Chưa chọn món ăn nào. Hãy chọn từ thực đơn bên phải nếu muốn đặt món trước.'
                              : 'No dishes pre-ordered. Select from the menu on the right to order in advance.'}
                          </p>
                        ) : (
                          editCart.map(item => (
                            <div key={item.variantId} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-extrabold text-slate-800 truncate">{item.productName}</p>
                                <p className="text-[9px] text-slate-400 font-semibold">{item.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[10px] text-slate-500">{formatCurrency(item.price)}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCartQty(item.variantId, -1)}
                                    className="h-4 w-4 bg-white rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="w-4 text-center font-bold text-[10px] text-slate-800">{item.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddCart({ id: item.variantId, price: item.price, name: item.name }, item.productName)}
                                    className="h-4 w-4 bg-white rounded border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center text-xs font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {editCart.length > 0 && (!editingBooking.depositAmount || editingBooking.depositAmount <= 0) && (
                        <p className="text-[9px] text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100">
                          ⚠️ {locale === 'vi'
                            ? 'Lưu ý: Thêm món ăn yêu cầu thanh toán đặt cọc 100,000 VND qua QR.'
                            : 'Note: Adding dishes requires a deposit payment of 100,000 VND via QR.'}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingBooking(null)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        {t.btnCancel}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#25439b] hover:bg-[#1c3580] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                      >
                        {t.btnSave}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Menu Explorer */}
              <div className="flex-1 md:w-[380px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-3 flex flex-col">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{locale === 'vi' ? 'Thực đơn nhà hàng' : 'Branch Menu'}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {locale === 'vi' ? 'Đặt trước để nhà hàng chuẩn bị sẵn sàng khi bạn đến' : 'Pre-order dishes for instant serving on arrival'}
                  </p>
                </div>

                {/* Menu Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    placeholder={locale === 'vi' ? 'Tìm món ăn...' : 'Search dishes...'}
                    className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-xs"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white border-blue-650'
                          : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu list */}
                <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
                  {loadingMenu ? (
                    <div className="flex items-center justify-center py-10">
                      <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : filteredMenuItems.length === 0 ? (
                    <p className="text-[10px] text-slate-450 font-medium text-center py-10 bg-slate-50 rounded-xl">
                      {locale === 'vi' ? 'Không tìm thấy món ăn nào' : 'No dishes found'}
                    </p>
                  ) : (
                    filteredMenuItems.map(item => {
                      const primaryVariant = item.variants && item.variants[0];
                      if (!primaryVariant) return null;

                      return (
                        <div key={item.id} className="flex gap-3 p-2 bg-white rounded-xl border border-slate-150 shadow-sm">
                          {item.imagePath ? (
                            <img src={item.imagePath} alt={item.name} className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-100" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                              <Utensils className="h-6 w-6 text-slate-355" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="font-extrabold text-xs text-slate-900 leading-tight truncate">{item.name}</p>
                              <p className="text-[9px] text-slate-400 font-medium line-clamp-2 mt-0.5">{item.description}</p>
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              {item.variants && item.variants.length > 1 ? (
                                <div className="space-y-1 w-full">
                                  {item.variants.map((v: any) => (
                                    <div key={v.id} className="flex justify-between items-center text-[9px] bg-slate-50 p-1 rounded border border-slate-100">
                                      <span className="font-semibold text-slate-500">{v.name}</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900">{formatCurrency(v.price)}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddCart(v, item.name)}
                                          className="h-4 w-4 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-center text-xs font-bold cursor-pointer"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  <span className="font-extrabold text-[11px] text-slate-900">{formatCurrency(primaryVariant.price)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddCart(primaryVariant, item.name)}
                                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-black transition cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>{locale === 'vi' ? 'Thêm' : 'Add'}</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
