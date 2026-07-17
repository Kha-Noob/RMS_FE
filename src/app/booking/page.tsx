'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { FloorPlan, FloorPlanObject, Branch } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Utensils,
  Calendar,
  Clock,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Info,
  CheckCircle,
  CreditCard,
  QrCode,
  Wallet,
  AlertTriangle,
  Sparkles,
  Search,
  ShoppingCart
} from 'lucide-react';

interface PreOrderItem {
  variantId: number;
  name: string;
  price: number;
  quantity: number;
  productName: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  categoryName: string;
  variants: Array<{
    id: number;
    name: string;
    price: number;
    sku: string;
    inStock: boolean;
  }>;
}

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

export default function BookingWizardPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  // --- Wizard Step State ---
  const [step, setStep] = useState<number>(1);

  // --- Step 1 States ---
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('18:30');
  const [guests, setGuests] = useState<number>(2);

  // --- Step 2 States (Floor Plan & Table Selection) ---
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [bookedTableIds, setBookedTableIds] = useState<number[]>([]);
  const [selectedTableObj, setSelectedTableObj] = useState<FloorPlanObject | null>(null);
  const [selectedTableConfirmed, setSelectedTableConfirmed] = useState<boolean>(false);
  const [loadingFloorPlan, setLoadingFloorPlan] = useState<boolean>(false);
  
  // Space Filters (US#2)
  const [spaceFilter, setSpaceFilter] = useState<'ALL' | 'VIP' | 'NON_SMOKING' | 'AC' | 'OUTDOOR'>('ALL');

  // --- Step 3 States (Info, Allergies & Menu Pre-order) ---
  const [custName, setCustName] = useState<string>(user?.name || '');
  const [custPhone, setCustPhone] = useState<string>(user?.phone || '');
  const [custEmail, setCustEmail] = useState<string>(user?.email || '');
  const [dietaryNotes, setDietaryNotes] = useState<string>('');
  const [allergyPeanut, setAllergyPeanut] = useState<boolean>(false);
  const [allergyGluten, setAllergyGluten] = useState<boolean>(false);
  const [allergyOthers, setAllergyOthers] = useState<string>('');

  // Menu Pre-Order States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [preOrderCart, setPreOrderCart] = useState<PreOrderItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);

  // --- Step 4 States (Deposit & Payments) ---
  const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'QR_PAY' | 'CARD' | 'WALLET'>('QR_PAY');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState<number>(300); // 5 mins countdown

  // --- Step 5 States (Success) ---
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (isPaying && createdBooking && createdBooking.id) {
      setPaymentTimeLeft(300); // Reset timer

      // Timer countdown
      timerInterval = setInterval(() => {
        setPaymentTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            clearInterval(pollInterval);
            setIsPaying(false);
            setIsSubmitting(false);
            toast.error(locale === 'vi' ? 'Hết thời gian thanh toán đặt cọc. Vui lòng thử lại!' : 'Payment timeout. Please try again!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Polling function
      const checkPaymentStatus = async () => {
        try {
          const booking = await api.get<any>(`/api/public/bookings/${createdBooking.id}`);
          if (booking && booking.paymentStatus === 'PAID') {
            clearInterval(timerInterval);
            clearInterval(pollInterval);
            setIsPaying(false);
            setCreatedBooking(booking); // Update details with PAID status
            setStep(5); // Proceed to success screen
            toast.success(locale === 'vi' ? 'Thanh toán tiền đặt cọc thành công!' : 'Deposit payment successful!');
          }
        } catch (err) {
          console.error("Error polling booking payment status", err);
        }
      };

      pollInterval = setInterval(checkPaymentStatus, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isPaying, createdBooking, locale]);

  // --- Load Branches & Pre-fill from URL parameters ---
  useEffect(() => {
    const queryParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const queryTenantId = queryParams.get('tenantId') || '';
    const queryBranchId = queryParams.get('branchId') || '';
    const queryDate = queryParams.get('date') || '';
    const queryTime = queryParams.get('time') || '';
    const queryGuests = queryParams.get('guests') || '';

    const loadBranches = async () => {
      try {
        const data = await api.get<Branch[]>('/api/public/branches', {
          params: queryTenantId ? { tenantId: queryTenantId } : undefined
        });
        setBranches(data);
        if (data.length > 0) {
          const preSelected = data.find(b => b.branchId === queryBranchId);
          setSelectedBranchId(preSelected ? preSelected.branchId : data[0].branchId);
        }
      } catch (err) {
        toast.error('Không thể tải danh sách chi nhánh!');
      }
    };
    loadBranches();
    
    setBookingDate(queryDate || new Date().toISOString().split('T')[0]);
    if (queryTime) setBookingTime(queryTime);
    if (queryGuests) setGuests(parseInt(queryGuests) || 2);
  }, []);

  // Sync user info if loaded later
  useEffect(() => {
    if (user) {
      if (!custName) setCustName(user.name || '');
      if (!custPhone) setCustPhone(user.phone || '');
      if (!custEmail) setCustEmail(user.email || '');
    }
  }, [user, custName, custPhone, custEmail]);

  // --- Fetch Floor Plans & Availability (Step 1 -> Step 2) ---
  const handleProceedToStep2 = async () => {
    if (!selectedBranchId) { toast.error('Vui lòng chọn chi nhánh!'); return; }
    if (!bookingDate) { toast.error('Vui lòng chọn ngày đặt bàn!'); return; }
    if (!bookingTime) { toast.error('Vui lòng chọn thời gian!'); return; }
    if (guests <= 0) { toast.error('Số lượng khách không hợp lệ!'); return; }

    try {
      setLoadingFloorPlan(true);
      setSelectedTableObj(null);
      setSelectedTableConfirmed(false);
      
      // 1. Fetch branch floor plans
      const plans = await api.get<FloorPlan[]>(`/api/public/branches/${selectedBranchId}/floor-plans`);
      setFloorPlans(plans);
      if (plans.length > 0) {
        setSelectedPlan(plans[0]);
      } else {
        setSelectedPlan(null);
      }

      // 2. Fetch occupied/reserved table IDs for this time slot
      const isoTime = `${bookingDate}T${bookingTime}:00`;
      const avail = await api.get<{ bookedTableIds: number[] }>(
        `/api/public/branches/${selectedBranchId}/tables/availability`,
        { params: { time: isoTime } }
      );
      setBookedTableIds(avail.bookedTableIds || []);

      setStep(2);
    } catch (err) {
      toast.error('Lỗi khi tải thông tin sơ đồ bàn!');
    } finally {
      setLoadingFloorPlan(false);
    }
  };

  // --- Load Menu Items (Step 2 -> Step 3) ---
  const handleProceedToStep3 = async () => {
    if (!selectedTableConfirmed || !selectedTableObj) {
      toast.error('Vui lòng chọn bàn và nhấp xác nhận vị trí!');
      return;
    }

    try {
      setLoadingMenu(true);
      const menu = await api.get<MenuItem[]>(`/api/public/branches/${selectedBranchId}/menu`);
      setMenuItems(menu);
      setStep(3);
    } catch (err) {
      toast.error('Không thể tải thực đơn!');
    } finally {
      setLoadingMenu(false);
    }
  };

  // --- Step 3 -> Step 4 ---
  const handleProceedToStep4 = () => {
    if (!custName.trim()) { toast.error('Vui lòng nhập họ và tên!'); return; }
    if (!/^[A-Za-zÀ-ỹ\s']{2,100}$/.test(custName.trim())) {
      toast.error('Họ và tên không hợp lệ (chỉ chứa chữ cái, từ 2-100 ký tự)!');
      return;
    }
    if (!custPhone.trim()) { toast.error('Vui lòng nhập số điện thoại!'); return; }
    if (!/^(0|\+84)[35789][0-9]{8}$/.test(custPhone.trim())) {
      toast.error('Số điện thoại không đúng định dạng Việt Nam hợp lệ (ví dụ: 0912345678)!');
      return;
    }
    if (custEmail.trim() && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(custEmail.trim())) {
      toast.error('Email không đúng định dạng (ví dụ: name@example.com)!');
      return;
    }
    setStep(4);
  };

  // --- Submit Booking ---
  const handleConfirmAndPay = async () => {
    if (!agreedToPolicy) {
      toast.error('Bạn phải đọc và đồng ý với chính sách đặt cọc và hoàn tiền!');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const bookingData = {
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail || null,
        bookingTime: `${bookingDate}T${bookingTime}:00`,
        guests: guests,
        branchId: selectedBranchId,
        notes: dietaryNotes || null,
        tableId: selectedTableObj?.tableId || selectedTableObj?.id || null,
        tableLabel: selectedTableObj?.label || null,
        dietaryNotes: dietaryNotes || null,
        allergyPeanut: allergyPeanut,
        allergyGluten: allergyGluten,
        allergyOthers: allergyOthers || null,
        orderedItemsJson: preOrderCart.length > 0 ? JSON.stringify(preOrderCart) : null,
        depositAmount: requireDeposit ? 100000.0 : 0.0,
        paymentMethod: requireDeposit ? paymentMethod : null,
        paymentStatus: 'PENDING',
        depositPaid: false,
        status: 'CONFIRMED'
      };

      const result = await api.post<any>('/api/public/bookings', bookingData);
      setCreatedBooking(result);
      
      if (requireDeposit) {
        setIsPaying(true);
      } else {
        setStep(5);
        toast.success('Đã đặt bàn thành công!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xử lý đặt bàn!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dynamic Room & Space Filtering (US#2) ---
  const getObjectColor = (obj: FloorPlanObject) => {
    const isBooked = (obj.tableId && bookedTableIds.includes(obj.tableId)) || bookedTableIds.includes(obj.id);
    if (isBooked) return '#ef4444'; // Red for booked
    return '#22c55e'; // Green for available
  };

  // Check if a room matches the filter
  const doesRoomMatchFilter = (roomName: string, roomId: number) => {
    const nameLower = roomName.toLowerCase();
    switch (spaceFilter) {
      case 'VIP':
        return nameLower.includes('vip') || roomId === 6;
      case 'AC':
        return nameLower.includes('lạnh') || nameLower.includes('lầu') || [2, 3, 4, 5].includes(roomId);
      case 'OUTDOOR':
        return nameLower.includes('sân') || nameLower.includes('ngoài') || roomId === 1;
      case 'NON_SMOKING':
        // All rooms are non-smoking except outdoor (Sân trước)
        return !nameLower.includes('sân');
      case 'ALL':
      default:
        return true;
    }
  };

  const parsedMeta = useMemo(() => {
    if (!selectedTableObj || !selectedTableObj.metadataJson) return {};
    if (typeof selectedTableObj.metadataJson !== 'string') return selectedTableObj.metadataJson;
    try {
      return JSON.parse(selectedTableObj.metadataJson);
    } catch {
      return {};
    }
  }, [selectedTableObj]);

  // Estmated distances helper based on table ID
  const estimatedDistances = useMemo(() => {
    if (!selectedTableObj) return null;
    const tid = selectedTableObj.id;
    return {
      wc: 5 + (tid % 4) * 2,
      aisle: 1.5 + (tid % 3) * 0.5,
      stage: 8 + (tid % 5) * 3
    };
  }, [selectedTableObj]);

  // --- Menu Processing ---
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Tất cả');
    menuItems.forEach(item => {
      if (item.categoryName) cats.add(item.categoryName);
    });
    return Array.from(cats);
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (selectedCategory === 'Tất cả') return menuItems;
    return menuItems.filter(item => item.categoryName === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleAddCart = (variant: any, pName: string) => {
    if (!variant.inStock) {
      toast.error('Món ăn này hiện đã hết hàng!');
      return;
    }
    setPreOrderCart(prev => {
      const idx = prev.findIndex(c => c.variantId === variant.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      } else {
        return [...prev, {
          variantId: variant.id,
          name: variant.name === 'Default' ? pName : `${pName} (${variant.name})`,
          price: variant.price,
          quantity: 1,
          productName: pName
        }];
      }
    });
    toast.success(`Đã thêm ${pName} vào danh sách đặt trước!`);
  };

  const handleUpdateCartQty = (variantId: number, diff: number) => {
    setPreOrderCart(prev => {
      const next = prev.map(c => {
        if (c.variantId === variantId) {
          return { ...c, quantity: Math.max(0, c.quantity + diff) };
        }
        return c;
      }).filter(c => c.quantity > 0);
      return next;
    });
  };

  // Prices calculation
  const subtotal = useMemo(() => {
    return preOrderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [preOrderCart]);

  const vat = useMemo(() => subtotal * 0.10, [subtotal]);
  const serviceCharge = useMemo(() => subtotal * 0.05, [subtotal]);
  const grandTotal = useMemo(() => subtotal + vat + serviceCharge, [subtotal, vat, serviceCharge]);

  const requireDeposit = useMemo(() => {
    // Requires deposit if pre-ordered total is > 0 or if they choose a VIP/Room 6 table
    return grandTotal > 0 || (selectedTableObj && (selectedTableObj.floorPlan?.name?.toLowerCase()?.includes('vip') || selectedTableObj.floorPlan?.id === 6));
  }, [grandTotal, selectedTableObj]);

  const selectedBranchObj = useMemo(() => {
    return branches.find(b => b.branchId === selectedBranchId) || null;
  }, [branches, selectedBranchId]);

  const selectedBranchName = useMemo(() => {
    return selectedBranchObj?.name || 'Chi nhánh';
  }, [selectedBranchObj]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      
      <Header />

      {/* 2. Progress Tracker */}
      <div className="bg-white border-b border-slate-200 py-4 shadow-inner">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-[11px] md:text-xs font-bold text-slate-400">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-600' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            <span>Thiết lập</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-600' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span>Chọn vị trí</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-blue-600' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            <span>Yêu cầu & Món</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step >= 4 ? 'text-blue-600' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>4</span>
            <span>Đặt cọc</span>
          </div>
          <div className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-1.5 ${step >= 5 ? 'text-emerald-600' : ''}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${step >= 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>5</span>
            <span>Hoàn thành</span>
          </div>
        </div>
      </div>

      {/* 3. Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* STEP 1: General Options */}
        {step === 1 && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">Thông tin cơ bản lượt đặt</h2>
              <p className="text-xs text-slate-500">Vui lòng chọn chi nhánh và thời gian cuộc hẹn của bạn</p>
            </div>

            <div className="space-y-4">
              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" /> Chi nhánh nhà hàng
                </label>
                <select
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 bg-white"
                >
                  {branches.map(b => (
                    <option key={b.branchId} value={b.branchId}>{b.name} - {b.address}</option>
                  ))}
                </select>
              </div>

              {/* Grid Date Time Guests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> Chọn ngày
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={e => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500" /> Chọn giờ
                  </label>
                  <select
                    value={bookingTime}
                    onChange={e => setBookingTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
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
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-blue-500" /> Số lượng khách
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={guests}
                    onChange={e => setGuests(parseInt(e.target.value) || 2)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedToStep2}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold text-sm transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              Xem sơ đồ bàn trống <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Floor Plan & Table Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 md:px-6 shadow-sm">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                  <MapPin className="h-4.5 w-4.5 text-blue-600" /> {selectedBranchName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Thời gian: <span className="text-blue-600 font-bold">{bookingDate} vào lúc {bookingTime}</span> | Khách: <span className="text-blue-600 font-bold">{guests} người</span>
                </p>
              </div>

              {/* Space filters (US#2) */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200/60 p-1.5 rounded-xl">
                <button
                  onClick={() => setSpaceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spaceFilter === 'ALL' ? 'bg-[#25439b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Tất cả khu vực
                </button>
                <button
                  onClick={() => setSpaceFilter('VIP')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spaceFilter === 'VIP' ? 'bg-[#25439b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Phòng riêng (VIP)
                </button>
                <button
                  onClick={() => setSpaceFilter('AC')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spaceFilter === 'AC' ? 'bg-[#25439b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Khu máy lạnh
                </button>
                <button
                  onClick={() => setSpaceFilter('OUTDOOR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spaceFilter === 'OUTDOOR' ? 'bg-[#25439b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Ngoài trời
                </button>
                <button
                  onClick={() => setSpaceFilter('NON_SMOKING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${spaceFilter === 'NON_SMOKING' ? 'bg-[#25439b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Không hút thuốc
                </button>
              </div>
            </div>

            {loadingFloorPlan ? (
              <div className="h-[50vh] bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
              </div>
            ) : !selectedPlan ? (
              <div className="h-[40vh] bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 text-sm">
                Không có sơ đồ bàn khả dụng cho chi nhánh này. Vui lòng quay lại và chọn chi nhánh khác.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                
                {/* 2D Canvas Area */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">{selectedPlan.name} (Tầng {selectedPlan.floorNumber})</span>
                      {floorPlans.length > 1 && (
                        <div className="flex gap-2">
                          {floorPlans.map(plan => (
                            <button
                              key={plan.id}
                              onClick={() => {
                                setSelectedPlan(plan);
                                setSelectedTableObj(null);
                                setSelectedTableConfirmed(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedPlan?.id === plan.id
                                  ? 'bg-[#25439b] text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {plan.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded bg-green-500" />
                        <span className="text-slate-500">Trống (Có sẵn)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3.5 w-3.5 rounded bg-red-500" />
                        <span className="text-slate-500">Đã đặt / Đang bận</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-auto border border-slate-200/80 rounded-xl bg-[#F8FAFC]" style={{ maxHeight: '60vh' }}>
                    <div
                      className="relative mx-auto my-4"
                      style={{
                        width: selectedPlan.width,
                        height: selectedPlan.height,
                      }}
                    >
                      {/* Background */}
                      {selectedPlan.backgroundImageUrl && (
                        <img
                          src={selectedPlan.backgroundImageUrl}
                          alt="Background"
                          className="absolute inset-0 pointer-events-none"
                          style={{ width: selectedPlan.width, height: selectedPlan.height, objectFit: 'contain' }}
                          draggable={false}
                        />
                      )}

                      {/* Objects Rendering */}
                      {(selectedPlan.floorPlanObjects || []).map(obj => {
                        const isTable = obj.objectType === 'table';
                        const isBooked = (obj.tableId && bookedTableIds.includes(obj.tableId)) || bookedTableIds.includes(obj.id);
                        
                        // Check room filtering
                        const belongsToActiveRoom = doesRoomMatchFilter(selectedPlan.name, selectedPlan.id);
                        if (!belongsToActiveRoom && isTable) return null;

                        const color = getObjectColor(obj);
                        const isSelected = selectedTableObj?.id === obj.id;

                        return (
                          <div
                            key={obj.id}
                            onClick={() => {
                              if (isTable) {
                                if (isBooked) {
                                  toast.error('Bàn này đã được đặt, vui lòng chọn bàn khác màu xanh!');
                                } else {
                                  setSelectedTableObj(selectedTableObj?.id === obj.id ? null : obj);
                                  setSelectedTableConfirmed(false);
                                }
                              }
                            }}
                            className={`absolute transition-all ${isTable ? 'cursor-pointer hover:scale-105 active:scale-95' : 'pointer-events-none'}`}
                            style={{
                              left: obj.x,
                              top: obj.y,
                              width: obj.width,
                              height: obj.height,
                              transform: `rotate(${obj.rotation}deg)`,
                              zIndex: obj.zIndex,
                            }}
                          >
                            <div
                              className="w-full h-full flex items-center justify-center text-[10px] font-black text-white rounded-lg shadow-sm border border-black/10"
                              style={{
                                borderRadius: obj.shape === 'circle' ? '50%' : '6px',
                                backgroundColor: isTable ? color : '#cbd5e1',
                                outline: isSelected ? '3px solid #25439b' : undefined,
                                opacity: isTable ? 0.9 : 0.4
                              }}
                            >
                              <span className="text-center drop-shadow-sm select-none">
                                {obj.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Selection Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Chi tiết vị trí chọn</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Nhấp trực tiếp vào bàn xanh để lựa chọn</p>
                  </div>

                  {selectedTableObj ? (
                    <div className="space-y-4 text-xs">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-blue-900 text-sm">{selectedTableObj.label}</span>
                          <span className="bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase">
                            Khả dụng
                          </span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">
                          Sức chứa tối đa: <span className="font-bold text-slate-900">{parsedMeta.capacity || 4} chỗ</span><br />
                          Vị trí khu vực: <span className="font-bold text-slate-900">{parsedMeta.zone || selectedPlan.name}</span>
                        </p>
                      </div>

                      {/* Estimated Distances (US#1) */}
                      {estimatedDistances && (
                        <div className="border border-slate-100 rounded-xl p-3.5 space-y-2">
                          <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Ước tính khoảng cách (Khoảng):</h4>
                          <ul className="space-y-1.5 text-slate-600 font-medium">
                            <li className="flex items-center justify-between">
                              <span>🚪 Cách lối đi chính:</span>
                              <span className="font-bold text-slate-900">{estimatedDistances.aisle}m</span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>🚽 Cách nhà vệ sinh:</span>
                              <span className="font-bold text-slate-900">~{estimatedDistances.wc}m</span>
                            </li>
                            <li className="flex items-center justify-between">
                              <span>🎸 Cách sân khấu chính:</span>
                              <span className="font-bold text-slate-900">~{estimatedDistances.stage}m</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {!selectedTableConfirmed ? (
                        <button
                          onClick={() => {
                            setSelectedTableConfirmed(true);
                            toast.success(`Đã chọn vị trí bàn: ${selectedTableObj.label}`);
                          }}
                          className="w-full py-2.5 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-xl font-bold transition shadow-sm"
                        >
                          Xác nhận chọn bàn này
                        </button>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 flex items-center gap-2 font-bold">
                          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>Đã khóa bàn: {selectedTableObj.label}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-6 text-center text-slate-450 text-xs py-10 font-medium">
                      Chưa có bàn nào được chọn. Vui lòng nhấp trực tiếp vào bàn trống trên sơ đồ.
                    </div>
                  )}

                  <div className="flex gap-3 border-t border-slate-100 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
                    </button>
                    <button
                      onClick={handleProceedToStep3}
                      disabled={!selectedTableConfirmed}
                      className="flex-1 py-2.5 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow"
                    >
                      Tiếp tục <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Personal Information, Dietary/Allergies & Pre-order Menu */}
        {step === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Info form & Dietary check (US#3) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Contacts */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2">1. Thông tin liên hệ</h3>
                {!user && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h4 className="font-extrabold text-blue-900 text-xs flex items-center justify-center sm:justify-start gap-1.5 uppercase tracking-wide">
                        <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" /> Đăng nhập nhanh bằng Google
                      </h4>
                      <p className="text-slate-600 text-[11px] font-medium leading-relaxed">
                        Tự động điền nhanh thông tin liên hệ, tích lũy điểm thưởng thành viên và xem lịch sử đặt bàn.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.setItem('oauth_redirect', window.location.pathname + window.location.search);
                        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
                        window.location.href = `${API_BASE}/oauth2/authorization/google`;
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-2 transition shrink-0 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Đăng nhập ngay
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Họ và tên *</label>
                    <input
                      type="text"
                      value={custName}
                      onChange={e => setCustName(e.target.value)}
                      required
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={custPhone}
                      onChange={e => setCustPhone(e.target.value)}
                      required
                      placeholder="VD: 0912345678"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Địa chỉ Email (Xác nhận hóa đơn/Mã đặt)</label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={e => setCustEmail(e.target.value)}
                      placeholder="VD: customer@gmail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Diet / Allergies (US#3) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <h3 className="font-extrabold text-slate-900 text-base">2. Yêu cầu ăn kiêng & Dị ứng nghiêm ngặt</h3>
                </div>

                <div className="space-y-4 text-xs font-semibold text-slate-650">
                  <p className="text-[11px] text-slate-400 font-medium">Để bảo đảm sức khỏe và an toàn tính mạng, vui lòng tick chọn nếu bạn bị dị ứng:</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allergyPeanut}
                        onChange={e => setAllergyPeanut(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-rose-700 font-bold">Dị ứng Đậu phộng (Nặng)</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allergyGluten}
                        onChange={e => setAllergyGluten(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Chế độ ăn Gluten-Free (Không lúa mì)</span>
                    </label>
                  </div>

                  {/* Severe Allergy kitchen response notice (US#3) */}
                  {(allergyPeanut || allergyGluten) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-850 p-4 rounded-xl space-y-1.5 animate-fade-in">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="h-4 w-4 text-amber-650 shrink-0" />
                        <span>Xác nhận từ nhà bếp</span>
                      </div>
                      <p className="font-medium text-slate-600 leading-relaxed text-[11px]">
                        "Nhà bếp đã ghi nhận thông tin dị ứng của bạn cho lượt đặt này. Chúng tôi sẽ chuẩn bị dụng cụ chế biến riêng biệt để ngăn ngừa hoàn toàn nguy cơ nhiễm chéo."
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">Dị ứng khác (nếu có)</label>
                    <input
                      type="text"
                      value={allergyOthers}
                      onChange={e => setAllergyOthers(e.target.value)}
                      placeholder="Ví dụ: Dị ứng tôm, cua, trứng sữa..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Sở thích ăn uống & Ghi chú không gian</label>
                    <textarea
                      value={dietaryNotes}
                      onChange={e => setDietaryNotes(e.target.value)}
                      rows={2}
                      placeholder="VD: Ghế cạnh cửa sổ, không ăn cay, tổ chức tiệc sinh nhật..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-350 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-order menu (US#4) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-blue-600" /> 3. Đặt món trước (Tiết kiệm thời gian chờ)
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">Không bắt buộc</span>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors ${selectedCategory === cat ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 border border-slate-200/50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                  {filteredMenuItems.map(item => {
                    const primaryVariant = item.variants[0];
                    const hasMultiVariants = item.variants.length > 1;
                    const inStock = primaryVariant?.inStock;

                    return (
                      <div key={item.id} className="border border-slate-200/80 rounded-xl p-3 flex gap-3 shadow-inner bg-slate-50/30">
                        {item.imagePath ? (
                          <img
                            src={item.imagePath}
                            alt={item.name}
                            className="h-16 w-16 md:h-20 md:w-20 rounded-lg object-cover bg-slate-150 shrink-0"
                          />
                        ) : (
                          <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg bg-slate-150 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                            No Photo
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between text-xs space-y-1">
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className="font-extrabold text-slate-800 text-[13px] leading-snug">{item.name}</h4>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {inStock ? 'Còn món' : 'Hết món'}
                              </span>
                            </div>
                            <p className="text-slate-450 text-[10px] line-clamp-2 leading-relaxed font-medium">{item.description || 'Chưa cập nhật mô tả.'}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="font-black text-blue-750 text-xs">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(primaryVariant?.price || 0)}
                            </span>
                            
                            {hasMultiVariants ? (
                              <div className="flex flex-col gap-1">
                                {item.variants.map(v => (
                                  <button
                                    key={v.id}
                                    onClick={() => handleAddCart(v, item.name)}
                                    disabled={!v.inStock}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed border border-blue-200 text-[9px] font-black rounded-lg transition"
                                  >
                                    + {v.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddCart(primaryVariant, item.name)}
                                disabled={!inStock}
                                className="px-3 py-1 bg-[#25439b] hover:bg-[#1c3580] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black rounded-lg transition shadow-sm"
                              >
                                Đặt trước
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Invoice Pre-order Overview & Navigation */}
            <div className="space-y-6">
              
              {/* Selected Table details */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
                <h4 className="font-extrabold text-slate-800 text-sm">Tóm tắt vị trí chọn</h4>
                <div className="text-xs bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-1.5 font-medium leading-relaxed">
                  <p>Bàn: <span className="font-extrabold text-slate-900">{selectedTableObj?.label}</span></p>
                  <p>Sức chứa: <span className="font-bold text-slate-900">{parsedMeta.capacity || 4} chỗ</span></p>
                  <p>Thời gian: <span className="font-bold text-slate-900">{bookingDate} lúc {bookingTime}</span></p>
                </div>
              </div>

              {/* Pre-order Cart Invoice breakdown (US#4) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-800 text-sm">Danh mục món ăn chọn trước</h4>
                
                {preOrderCart.length > 0 ? (
                  <div className="space-y-3 text-xs">
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                      {preOrderCart.map(item => (
                        <div key={item.variantId} className="flex justify-between items-center py-2">
                          <div className="space-y-0.5 max-w-[70%]">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleUpdateCartQty(item.variantId, -1)} className="h-5 w-5 bg-slate-100 rounded-lg text-slate-600 font-bold hover:bg-slate-200 flex items-center justify-center">-</button>
                            <span className="font-black text-slate-800 text-xs w-4 text-center">{item.quantity}</span>
                            <button onClick={() => handleAddCart({ id: item.variantId, inStock: true, price: item.price }, item.productName)} className="h-5 w-5 bg-slate-100 rounded-lg text-slate-600 font-bold hover:bg-slate-200 flex items-center justify-center">+</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2 font-medium text-slate-500">
                      <div className="flex justify-between">
                        <span>Tạm tính:</span>
                        <span className="font-bold text-slate-800">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thuế VAT (10%):</span>
                        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(vat)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-500">
                        <span>Phí phục vụ (5%):</span>
                        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(serviceCharge)}</span>
                      </div>
                      <div className="flex justify-between text-blue-750 font-black text-sm border-t border-slate-100 pt-2">
                        <span>Tổng dự kiến:</span>
                        <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-6 text-xs font-medium">
                    Chưa có món ăn nào được chọn trước.
                  </div>
                )}
              </div>

              {/* Wizard Nav */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Quay lại
                </button>
                <button
                  onClick={handleProceedToStep4}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow"
                >
                  Tiếp tục <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Deposit & Policies */}
        {step === 4 && (
          isPaying ? (
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-center animate-fade-in">
              <div className="space-y-4">
                {/* Visual loading ring */}
                <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                  <QrCode className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">Đang kiểm tra thanh toán đặt cọc</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Hệ thống đang tự động rà soát giao dịch chuyển khoản ngân hàng của bạn. Vui lòng giữ nguyên trang, quá trình xác thực mất khoảng 5-15 giây.
                  </p>
                </div>

                {/* Countdown Timer */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-amber-700 font-extrabold text-[10px]">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>
                    {Math.floor(paymentTimeLeft / 60)}:{(paymentTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Bank details and VietQR */}
                {selectedBranchObj && selectedBranchObj.bankAccountNo && (
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-2.5 text-xs font-semibold text-left text-slate-700">
                    <p className="text-[10px] text-indigo-550 font-black uppercase tracking-wider flex items-center gap-1">
                      <span>🏦</span> Thông tin tài khoản nhận đặt cọc
                    </p>
                    <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px]">
                      <span className="text-slate-450 font-bold">Ngân hàng:</span>
                      <span className="font-extrabold text-slate-800">{selectedBranchObj.bankName}</span>
                      
                      <span className="text-slate-450 font-bold">Số tài khoản:</span>
                      <span className="font-black text-indigo-700 select-all">{selectedBranchObj.bankAccountNo}</span>
                      
                      <span className="text-slate-450 font-bold">Chủ tài khoản:</span>
                      <span className="font-extrabold text-slate-800 uppercase">{selectedBranchObj.bankAccountName}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-dashed border-indigo-200 gap-1 mt-2 shadow-inner">
                      <img 
                        src={`https://img.vietqr.io/image/${getVietQrBankId(selectedBranchObj.bankName || '')}-${selectedBranchObj.bankAccountNo}-compact.png?amount=100000&addInfo=${encodeURIComponent(`DC ${custName.toUpperCase()} ${custPhone}`)}&accountName=${encodeURIComponent(selectedBranchObj.bankAccountName || '')}`}
                        alt="VietQR Payment Code"
                        className="w-32 h-32 object-contain rounded-lg border border-slate-100 shadow-sm"
                      />
                      <p className="text-[8px] text-rose-500 font-black text-center animate-pulse">
                        * Vui lòng giữ nguyên số tiền và nội dung chuyển khoản khi quét
                      </p>
                      {createdBooking && createdBooking.checkoutUrl && (
                        <a
                          href={createdBooking.checkoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 w-full text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          💳 {locale === 'vi' ? 'Thanh toán tự động qua PayOS' : 'Pay Automatically via PayOS'}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (createdBooking && createdBooking.id) {
                              await api.post('/api/public/webhook/banking', {
                                error: 0,
                                data: [
                                  {
                                    description: `DC ${createdBooking.id}`,
                                    amount: 100000,
                                    when: new Date().toISOString()
                                  }
                                ]
                              });
                              toast.success(locale === 'vi' ? 'Hệ thống đã tự động nhận diện giao dịch chuyển khoản cọc thành công!' : 'System automatically detected deposit payment transfer!');
                            }
                          } catch (err) {
                            toast.error('Simulation failed');
                          }
                        }}
                        className="mt-2 w-full py-1.5 px-3 bg-gradient-to-r from-emerald-550 to-teal-650 hover:from-emerald-650 hover:to-teal-750 text-white rounded-lg text-[9px] font-black transition shadow-sm cursor-pointer animate-pulse"
                      >
                        ⚡ {locale === 'vi' ? 'Giả lập Banking tự động nhận diện' : 'Simulate Auto-Banking Webhook'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaying(false);
                    setIsSubmitting(false);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                >
                  Quay lại để sửa đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="text-center space-y-1 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-extrabold text-slate-900">Đặt cọc giữ chỗ & Điều khoản</h2>
                <p className="text-xs text-slate-500">Xem xét cẩn thận các điều khoản trước khi bấm đặt bàn</p>
              </div>

              {/* Clear refund policies (US#5) */}
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-100 text-rose-900 rounded-xl p-4.5 space-y-3">
                  <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-rose-600" /> CHÍNH SÁCH ĐẶT CỌC & HỦY BÀN SÒNG PHẲNG
                  </h4>
                  <div className="text-[12px] font-semibold text-slate-650 leading-relaxed space-y-2">
                    <p>Để duy trì chỗ ngồi trống và bảo đảm các nguyên liệu chế biến trước được chuẩn bị tốt nhất:</p>
                    
                    {/* Large font policy list */}
                    <table className="w-full text-xs font-extrabold border-collapse border border-rose-200 mt-2 bg-white rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-rose-100 text-rose-900 text-left">
                          <th className="p-2 border border-rose-250">Thời gian hủy</th>
                          <th className="p-2 border border-rose-250">Tỷ lệ hoàn tiền cọc</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        <tr>
                          <td className="p-2 border border-rose-200">Trước 24 giờ kể từ giờ đón</td>
                          <td className="p-2 border border-rose-200 text-emerald-650 font-black">Hoàn trả 100% tiền cọc</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="p-2 border border-rose-200">Từ 2 giờ đến 24 giờ trước giờ đón</td>
                          <td className="p-2 border border-rose-200 text-amber-600 font-black">Hoàn trả 50% tiền cọc</td>
                        </tr>
                        <tr>
                          <td className="p-2 border border-rose-200">Dưới 2 giờ hoặc trễ hẹn quá 15 phút</td>
                          <td className="p-2 border border-rose-200 text-rose-600 font-black">Không được hoàn cọc (0%)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Deposit amount show */}
                {requireDeposit ? (
                  <div className="bg-blue-50 border border-blue-150 rounded-xl p-4 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-blue-900">Số tiền đặt cọc yêu cầu:</p>
                      <p className="text-[10px] text-slate-400">Bao gồm cọc giữ bàn VIP và 20% đặt trước món ăn</p>
                    </div>
                    <span className="text-base font-black text-blue-750">100.000 ₫</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-4 flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-emerald-900">Chi phí đặt cọc:</p>
                      <p className="text-[10px] text-slate-400">Không yêu cầu cọc cho cuộc hẹn thông thường</p>
                    </div>
                    <span className="text-sm font-black text-emerald-700">Miễn phí cọc</span>
                  </div>
                )}

                {/* Mandatory acceptance checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={agreedToPolicy}
                    onChange={e => setAgreedToPolicy(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                  />
                  <span className="text-[11px] md:text-xs font-bold text-slate-650 leading-relaxed">
                    "Tôi đã đọc và đồng ý với chính sách đặt cọc và chính sách hủy bàn/hoàn tiền được hiển thị ở trên." *
                  </span>
                </label>

                {/* Payment Methods (US#5) */}
                {requireDeposit && (
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">Phương thức thanh toán đặt cọc:</label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('QR_PAY')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${paymentMethod === 'QR_PAY' ? 'border-[#25439b] bg-blue-50/50 text-[#25439b]' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                      >
                        <QrCode className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Chuyển khoản QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('CARD')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${paymentMethod === 'CARD' ? 'border-[#25439b] bg-blue-50/50 text-[#25439b]' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Thẻ Quốc Tế</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('WALLET')}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${paymentMethod === 'WALLET' ? 'border-[#25439b] bg-blue-50/50 text-[#25439b]' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                      >
                        <Wallet className="h-5 w-5" />
                        <span className="text-[10px] font-bold">Ví Momo/ZaloPay</span>
                      </button>
                    </div>

                    {/* Bank Transfer Details (US#1) */}
                    {paymentMethod === 'QR_PAY' && selectedBranchObj && selectedBranchObj.bankAccountNo && (
                      <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 space-y-2 text-xs font-semibold animate-fade-in text-slate-750 mt-2">
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-wider flex items-center gap-1">
                          <span>🏦</span> Thông tin tài khoản nhận đặt cọc
                        </p>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px]">
                          <span className="text-slate-450 font-bold">Ngân hàng:</span>
                          <span className="font-extrabold text-slate-800">{selectedBranchObj.bankName}</span>
                          
                          <span className="text-slate-450 font-bold">Số tài khoản:</span>
                          <span className="font-black text-indigo-700 select-all">{selectedBranchObj.bankAccountNo}</span>
                          
                          <span className="text-slate-450 font-bold">Chủ tài khoản:</span>
                          <span className="font-extrabold text-slate-800 uppercase">{selectedBranchObj.bankAccountName}</span>
                          
                          {selectedBranchObj.bankBranch && (
                            <>
                              <span className="text-slate-450 font-bold">Chi nhánh:</span>
                              <span className="font-bold text-slate-700">{selectedBranchObj.bankBranch}</span>
                            </>
                          )}
                        </div>
                        {/* VietQR Code Display */}
                        <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-dashed border-indigo-200 gap-1.5 mt-2.5 shadow-inner">
                          <p className="text-[9px] text-indigo-550 font-black uppercase tracking-wider flex items-center gap-1">
                            <span>📲</span> {locale === 'vi' ? 'Quét mã VietQR để thanh toán đặt cọc' : 'Scan VietQR to Pay Deposit'}
                          </p>
                          <img 
                            src={`https://img.vietqr.io/image/${getVietQrBankId(selectedBranchObj.bankName || '')}-${selectedBranchObj.bankAccountNo}-compact.png?amount=100000&addInfo=${encodeURIComponent(`DC ${custName.toUpperCase()} ${custPhone}`)}&accountName=${encodeURIComponent(selectedBranchObj.bankAccountName || '')}`}
                            alt="VietQR Payment Code"
                            className="w-40 h-40 object-contain rounded-lg border border-slate-100 shadow-sm"
                          />
                          <p className="text-[8px] text-rose-500 font-black text-center animate-pulse">
                            {locale === 'vi' 
                              ? '* Vui lòng giữ nguyên số tiền và nội dung chuyển khoản khi quét' 
                              : '* Please keep amount and transfer note unchanged'}
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium pt-1.5 border-t border-dashed border-slate-200">
                          Vui lòng chuyển khoản đúng số tiền 100.000 ₫ và ghi rõ nội dung chuyển khoản là tên và số điện thoại của bạn.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
                <button
                  onClick={handleConfirmAndPay}
                  disabled={isSubmitting || !agreedToPolicy}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-bold text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow"
                >
                  {isSubmitting ? 'Đang xử lý...' : requireDeposit ? 'Thanh toán & Hoàn tất' : 'Xác nhận Đặt bàn'}
                </button>
              </div>
            </div>
          )
        )}

        {/* STEP 5: Success & Check-in QR (US#6 & US#7) */}
        {step === 5 && createdBooking && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-center">
            
            <div className="flex flex-col items-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-650 shadow-inner">
                <CheckCircle className="h-6.5 w-6.5" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Đặt bàn Thành công!</h2>
              <p className="text-xs text-slate-400">Một xác nhận giữ chỗ đã được gửi tức thời qua Zalo/SMS & Email của bạn.</p>
            </div>

            {/* Check-in QR Block (US#6) */}
            <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center space-y-4 max-w-sm mx-auto">
              <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                {/* Real Generated Check-in QR */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `=== THÔNG TIN ĐẶT BÀN ===\n` +
                    `Mã đặt bàn: RMS-BK${createdBooking.id}\n` +
                    `Khách hàng: ${createdBooking.customerName}\n` +
                    `Số điện thoại: ${createdBooking.customerPhone}\n` +
                    `Thời gian: ${new Date(createdBooking.bookingTime).toLocaleString('vi-VN')}\n` +
                    `Số lượng khách: ${createdBooking.guests} người\n` +
                    `Bàn cụ thể: ${createdBooking.tableLabel || 'Tùy chọn'}\n` +
                    `Số tiền cọc: ${createdBooking.depositAmount > 0 ? createdBooking.depositAmount.toLocaleString('vi-VN') + 'đ' : '0đ'}\n` +
                    `Ghi chú: ${createdBooking.notes || 'Không có'}\n` +
                    `========================`
                  )}`}
                  alt="Check-in QR"
                  className="w-36 h-36 rounded-lg object-contain"
                />
              </div>

              <div className="text-xs space-y-1.5 w-full text-left border-t border-slate-200/60 pt-4 font-semibold text-slate-650">
                <div className="flex justify-between">
                  <span>Mã đặt bàn:</span>
                  <span className="font-extrabold text-blue-900 text-sm">RMS-BK{createdBooking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số bàn cụ thể:</span>
                  <span className="font-bold text-slate-900">{createdBooking.tableLabel || 'Tùy chọn'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giờ đón khách:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(createdBooking.bookingTime).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số lượng người:</span>
                  <span className="font-bold text-slate-900">{createdBooking.guests} người</span>
                </div>
                {createdBooking.depositAmount > 0 && (
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5">
                    <span>Số tiền đã cọc:</span>
                    <span className="font-black text-emerald-650">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(createdBooking.depositAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs font-semibold text-slate-600 text-left flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Bạn có thể tự quản lý, chỉnh sửa giờ hẹn, thay đổi số lượng người hoặc hủy bàn trực tiếp trong mục <Link href="/profile" className="text-blue-600 hover:underline font-extrabold">Trang cá nhân</Link> trước thời gian đón khách ít nhất 2 giờ mà không cần gọi điện tới hotline hỗ trợ.
              </p>
            </div>

            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-xl font-bold text-xs transition shadow cursor-pointer"
            >
              Xem lịch sử đặt bàn của tôi
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
