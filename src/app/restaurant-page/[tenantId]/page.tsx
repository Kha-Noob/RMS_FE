'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { 
  FileText, Calendar, MessageSquare, ChevronLeft, 
  MapPin, Clock, Award, Star, ShieldAlert, AlertCircle, RefreshCw,
  Utensils, Phone, User, CheckCircle2, ChevronRight, Share2, Sparkles, Send,
  X, QrCode, Ticket, Info
} from 'lucide-react';

interface CustomPageConfig {
  id?: number;
  tenantId: string;
  restaurantName: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  layoutStyle: string;
  coverImageUrl: string;
  showPosts: boolean;
  showEvents: boolean;
  showReviews: boolean;
  published: boolean;
}

interface Article {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

interface CulinaryEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  restaurantName: string;
  tag: string;
  imageUrl?: string;
  price: string;
  capacity: string;
  description: string;
  highlights?: string[];
  branchId?: string;
  eventDates?: string[];
  bookingDeadline?: string | null;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  bankBranch?: string;
}

const getVietQrBankId = (bankName: string) => {
  const name = bankName.toLowerCase().trim();
  if (name.includes('vietcombank') || name.includes('vcb')) return 'vietcombank';
  if (name.includes('techcombank') || name.includes('tcb')) return 'techcombank';
  if (name.includes('vietinbank') || name.includes('ctg')) return 'vietinbank';
  if (name.includes('bidv')) return 'bidv';
  if (name.includes('mbbank') || name.includes('mb')) return 'mb';
  if (name.includes('acb')) return 'acb';
  if (name.includes('tpbank') || name.includes('tpb')) return 'tpb';
  if (name.includes('sacombank')) return 'sacombank';
  if (name.includes('vpbank')) return 'vpbank';
  if (name.includes('agribank')) return 'agribank';
  return 'vietcombank';
};

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

interface FloorPlan {
  id: number;
  name: string;
  width: number;
  height: number;
  imageUrl?: string | null;
  floorPlanObjects?: FloorPlanObject[];
}

interface FloorPlanObject {
  id: number;
  label: string;
  objectType: 'table' | 'wall' | 'decor' | 'entrance' | 'toilet' | 'bar';
  shape: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  metadataJson?: string;
  floorPlan?: {
    id: number;
    name: string;
  };
}

interface ReviewPost {
  id: number;
  authorName: string;
  content: string;
  rating?: number;
  createdAt: string;
}

export default function PublicRestaurantPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = use(params);
  const tenantId = resolvedParams.tenantId;

  const [config, setConfig] = useState<CustomPageConfig | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<CulinaryEvent[]>([]);
  const [reviews, setReviews] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick booking state
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '18:30',
    guests: 2,
    notes: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Event booking state
  const [bookingEvent, setBookingEvent] = useState<CulinaryEvent | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateCapacities, setDateCapacities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<'QR_PAY' | 'CARD' | 'WALLET'>('QR_PAY');
  const [eventBookingForm, setEventBookingForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '18:30',
    guests: 2,
    notes: '',
    branchId: ''
  });
  const [isEventBookingSuccess, setIsEventBookingSuccess] = useState(false);
  const [eventBookingCode, setEventBookingCode] = useState('');
  const [submittingEventBooking, setSubmittingEventBooking] = useState(false);

  // --- Wizard Step State for Table Booking ---
  const [tableStep, setTableStep] = useState<number>(1);
  const [tableBookingOpen, setTableBookingOpen] = useState<boolean>(false);

  // --- Step 2 States (Floor Plan & Table Selection) ---
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [bookedTableIds, setBookedTableIds] = useState<number[]>([]);
  const [selectedTableObj, setSelectedTableObj] = useState<FloorPlanObject | null>(null);
  const [selectedTableConfirmed, setSelectedTableConfirmed] = useState<boolean>(false);
  const [loadingFloorPlan, setLoadingFloorPlan] = useState<boolean>(false);
  const [spaceFilter, setSpaceFilter] = useState<'ALL' | 'VIP' | 'NON_SMOKING' | 'AC' | 'OUTDOOR'>('ALL');

  // --- Step 3 States (Info, Allergies & Menu Pre-order) ---
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custEmail, setCustEmail] = useState<string>('');
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
  const [tablePaymentMethod, setTablePaymentMethod] = useState<'QR_PAY' | 'CARD' | 'WALLET'>('QR_PAY');
  const [isSubmittingTable, setIsSubmittingTable] = useState<boolean>(false);

  // --- Step 5 States (Success) ---
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  useEffect(() => {
    loadPageData();
  }, [tenantId]);

  const loadPageData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch custom page layout configuration
      const configData = await api.get(`/api/public/custom-pages/${tenantId}`);
      const pageConfig = configData as CustomPageConfig;
      setConfig(pageConfig);

      // Fetch branches for this tenant
      try {
        const branchesData = await api.get(`/api/public/branches?tenantId=${tenantId}`);
        const branchList = branchesData as any[];
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].branchId);
        }
      } catch (e) {
        console.warn('Failed to load branches:', e);
      }

      // Initialize booking date to local today or tomorrow if late night
      const initDate = new Date();
      if (initDate.getHours() >= 21) {
        initDate.setDate(initDate.getDate() + 1);
      }
      const year = initDate.getFullYear();
      const month = String(initDate.getMonth() + 1).padStart(2, '0');
      const day = String(initDate.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;

      setBookingForm(prev => ({
        ...prev,
        date: localDateStr
      }));

      // 2. Fetch public articles
      if (pageConfig.showPosts) {
        try {
          const postsData = await api.get(`/api/public/articles/tenant/${tenantId}`);
          setArticles((postsData as Article[]).slice(0, 4));
        } catch (e) {
          console.warn('Failed to load articles:', e);
        }
      }

      // 3. Fetch public events
      if (pageConfig.showEvents) {
        try {
          const eventsData = await api.get(`/api/events/public/tenant/${tenantId}`);
          setEvents((eventsData as CulinaryEvent[]).slice(0, 3));
        } catch (e) {
          console.warn('Failed to load events:', e);
        }
      }

      // 4. Fetch public review posts
      if (pageConfig.showReviews) {
        try {
          const reviewsData = await api.get(`/api/public/feed/posts/tenant/${tenantId}`);
          const reviewList = Array.isArray(reviewsData) 
            ? reviewsData 
            : (reviewsData as any).content || [];
          setReviews(reviewList.slice(0, 4));
        } catch (e) {
          console.warn('Failed to load reviews:', e);
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể tải thông tin trang nhà hàng.');
    } finally {
      setLoading(false);
    }
  };

  const parseEventStartTime = (timeStr: string) => {
    if (!timeStr) return '18:30';
    const parts = timeStr.split('-');
    const start = parts[0].trim();
    const match = start.match(/\d{2}:\d{2}/);
    return match ? match[0] : '18:30';
  };

  const parseMaxCapacity = (capStr: string) => {
    if (!capStr) return 9999;
    const clean = capStr.replace(/[^0-9]/g, '');
    const num = parseInt(clean);
    return isNaN(num) ? 9999 : num;
  };

  const handleOpenEventBooking = (evt: CulinaryEvent) => {
    if (evt.bookingDeadline && new Date().getTime() > new Date(evt.bookingDeadline).getTime()) {
      toast.error('Sự kiện này đã hết thời hạn đăng ký!');
      return;
    }
    setBookingEvent(evt);
    const parsedTime = evt.time ? parseEventStartTime(evt.time) : '18:30';
    
    // Default to today if event has no dates listed
    const dates = evt.eventDates && evt.eventDates.length > 0 ? evt.eventDates : [new Date().toISOString().split('T')[0]];
    setAvailableDates(dates);
    setSelectedDates([dates[0]]); // default select first date

    // Fetch capacity info for all dates
    const bId = evt.branchId || (branches.length > 0 ? branches[0].branchId : '01-2thang9');
    const title = evt.title;
    const capMap: Record<string, number> = {};

    Promise.all(
      dates.map(d => 
        api.get<{ bookedGuests: number }>('/api/public/bookings-capacity/event', {
          params: { branchId: bId, eventTitle: title, eventId: evt.id, date: d }
        })
        .then(res => {
          capMap[d] = res.bookedGuests;
        })
        .catch(() => {
          capMap[d] = 0;
        })
      )
    ).then(() => {
      setDateCapacities({...capMap});
    });

    setEventBookingForm({
      name: '',
      phone: '',
      date: dates[0],
      time: parsedTime,
      guests: 2,
      notes: evt.title ? `Đăng ký tham gia sự kiện: ${evt.title}` : '',
      branchId: bId
    });
    setIsEventBookingSuccess(false);
  };

  const handleToggleDate = (date: string) => {
    if (selectedDates.includes(date)) {
      if (selectedDates.length > 1) {
        setSelectedDates(selectedDates.filter(d => d !== date));
      } else {
        toast.warning('Vui lòng chọn ít nhất một ngày!');
      }
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleConfirmEventBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventBookingForm.name.trim()) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }
    if (!eventBookingForm.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại liên lạc.');
      return;
    }
    if (!eventBookingForm.phone.match("^[0-9\\+\\-\\s()]{9,15}$")) {
      toast.error('Số điện thoại không đúng định dạng!');
      return;
    }
    if (selectedDates.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày diễn ra!');
      return;
    }

    const minFutureTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins in future

    // Validate future restriction for all selected dates
    for (const d of selectedDates) {
      const bookingTime = `${d}T${eventBookingForm.time}:00`;
      const selectedDateTime = new Date(bookingTime);
      if (selectedDateTime.getTime() < minFutureTime.getTime()) {
        const displayD = d.split('-').reverse().join('/');
        toast.error(`Thời gian của ngày ${displayD} phải ở tương lai (tối thiểu trước 15 phút)!`);
        return;
      }
    }

    setSubmittingEventBooking(true);
    try {
      const isPaid = bookingEvent && bookingEvent.price && !bookingEvent.price.includes('Miễn phí') && !bookingEvent.price.toLowerCase().includes('free');
      const singlePrice = isPaid ? (parseInt(bookingEvent.price.replace(/[^0-9]/g, '')) || 0) : 0;

      // Post all bookings in parallel
      const promises = selectedDates.map(d => {
        const payload = {
          eventId: bookingEvent?.id || null,
          customerName: eventBookingForm.name,
          customerPhone: eventBookingForm.phone,
          bookingTime: `${d}T${eventBookingForm.time}:00`,
          guests: eventBookingForm.guests,
          branchId: eventBookingForm.branchId,
          notes: eventBookingForm.notes,
          tableId: null,
          paymentMethod: isPaid ? paymentMethod : null,
          paymentStatus: isPaid ? 'PAID' : 'PENDING',
          depositPaid: isPaid ? true : false,
          depositAmount: isPaid ? (singlePrice * eventBookingForm.guests) : 0.0
        };
        return api.post<any>('/api/public/bookings', payload);
      });

      const results = await Promise.all(promises);
      const codes = results.map(res => res.id ? `#${res.id}` : '').filter(Boolean).join(', ');
      setEventBookingCode(codes || 'EVT-' + Math.floor(1000 + Math.random() * 9000));
      setIsEventBookingSuccess(true);
      toast.success('Đăng ký vé sự kiện thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Đặt vé thất bại, vui lòng thử lại.');
    } finally {
      setSubmittingEventBooking(false);
    }
  };

  const getObjectColor = (obj: FloorPlanObject) => {
    const isBooked = (obj.tableId && bookedTableIds.includes(obj.tableId)) || bookedTableIds.includes(obj.id);
    if (isBooked) return '#ef4444'; // Red for booked
    return '#22c55e'; // Green for available
  };

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
        return !nameLower.includes('sân');
      case 'ALL':
      default:
        return true;
    }
  };

  const parsedMeta = selectedTableObj && selectedTableObj.metadataJson
    ? (() => {
        try {
          return JSON.parse(selectedTableObj.metadataJson);
        } catch {
          return {};
        }
      })()
    : {};

  const estimatedDistances = selectedTableObj
    ? (() => {
        const tid = selectedTableObj.id;
        return {
          wc: 5 + (tid % 4) * 2,
          aisle: 1.5 + (tid % 3) * 0.5,
          stage: 8 + (tid % 5) * 3
        };
      })()
    : null;

  const categories = (() => {
    const cats = new Set<string>();
    cats.add('Tất cả');
    menuItems.forEach(item => {
      if (item.categoryName) cats.add(item.categoryName);
    });
    return Array.from(cats);
  })();

  const filteredMenuItems = selectedCategory === 'Tất cả'
    ? menuItems
    : menuItems.filter(item => item.categoryName === selectedCategory);

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

  const subtotal = preOrderCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = subtotal * 0.10;
  const serviceCharge = subtotal * 0.05;
  const grandTotal = subtotal + vat + serviceCharge;

  const requireDeposit = grandTotal > 0 || (selectedTableObj && (selectedTableObj.floorPlan?.name?.toLowerCase()?.includes('vip') || selectedTableObj.floorPlan?.id === 6));

  const selectedBranchObj = branches.find(b => b.branchId === selectedBranchId) || null;
  const selectedBranchName = selectedBranchObj?.name || 'Chi nhánh';

  const handleProceedToStep2 = async () => {
    if (!selectedBranchId) { toast.error('Vui lòng chọn chi nhánh!'); return; }
    if (!bookingForm.date) { toast.error('Vui lòng chọn ngày đặt bàn!'); return; }
    if (!bookingForm.time) { toast.error('Vui lòng chọn thời gian!'); return; }
    if (bookingForm.guests <= 0) { toast.error('Số lượng khách không hợp lệ!'); return; }

    try {
      setLoadingFloorPlan(true);
      setSelectedTableObj(null);
      setSelectedTableConfirmed(false);
      setTableStep(2);
      setTableBookingOpen(true);
      
      // 1. Fetch branch floor plans
      const plans = await api.get<FloorPlan[]>(`/api/public/branches/${selectedBranchId}/floor-plans`);
      setFloorPlans(plans);
      if (plans.length > 0) {
        setSelectedPlan(plans[0]);
      } else {
        setSelectedPlan(null);
      }

      // 2. Fetch occupied/reserved table IDs for this time slot
      const isoTime = `${bookingForm.date}T${bookingForm.time}:00`;
      const avail = await api.get<{ bookedTableIds: number[] }>(
        `/api/public/branches/${selectedBranchId}/tables/availability`,
        { params: { time: isoTime } }
      );
      setBookedTableIds(avail.bookedTableIds || []);
    } catch (err) {
      toast.error('Lỗi khi tải thông tin sơ đồ bàn!');
    } finally {
      setLoadingFloorPlan(false);
    }
  };

  const handleProceedToStep3 = async () => {
    if (!selectedTableConfirmed || !selectedTableObj) {
      toast.error('Vui lòng chọn bàn và nhấp xác nhận vị trí!');
      return;
    }

    try {
      setLoadingMenu(true);
      const menu = await api.get<MenuItem[]>(`/api/public/branches/${selectedBranchId}/menu`);
      setMenuItems(menu);
      setTableStep(3);
    } catch (err) {
      toast.error('Không thể tải thực đơn!');
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleProceedToStep4 = () => {
    if (!custName.trim()) { toast.error('Vui lòng nhập họ và tên!'); return; }
    if (!custPhone.trim()) { toast.error('Vui lòng nhập số điện thoại!'); return; }
    setTableStep(4);
  };

  const handleConfirmAndPay = async () => {
    if (requireDeposit && !agreedToPolicy) {
      toast.error('Bạn phải đọc và đồng ý với chính sách đặt cọc và hoàn tiền!');
      return;
    }

    try {
      setIsSubmittingTable(true);
      
      const bookingData = {
        customerName: custName,
        customerPhone: custPhone,
        customerEmail: custEmail || null,
        bookingTime: `${bookingForm.date}T${bookingForm.time}:00`,
        guests: bookingForm.guests,
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
        paymentMethod: requireDeposit ? tablePaymentMethod : null,
        paymentStatus: requireDeposit ? 'PAID' : 'PENDING',
        status: 'CONFIRMED'
      };

      const result = await api.post<any>('/api/public/bookings', bookingData);
      setCreatedBooking(result);
      setTableStep(5);
      toast.success('Đã đặt bàn thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xử lý đặt bàn!');
    } finally {
      setIsSubmittingTable(false);
    }
  };

  const copyPageLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết trang nhà hàng!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-55 animate-pulse">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-violet-500 absolute top-5 left-5 animate-ping" />
        </div>
        <span className="text-slate-500 font-extrabold text-sm mt-5 tracking-widest uppercase">Đang đồng bộ giao diện nghệ thuật...</span>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="w-14 h-14 text-rose-500 animate-bounce" />
        <h1 className="text-2xl font-black text-slate-800">Không tìm thấy trang</h1>
        <p className="text-slate-500 text-sm leading-relaxed">{error || 'Trang thiết kế của nhà hàng này không tồn tại hoặc chưa được xuất bản.'}</p>
        <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95">
          Trở lại trang chủ RMS
        </Link>
      </div>
    );
  }

  // Google Font Import Link
  const fontLink = config.fontFamily && config.fontFamily !== 'Inter' && config.fontFamily !== 'Roboto'
    ? `https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(' ', '+')}:wght@300;400;500;700;900&display=swap`
    : '';

  // Layout-based styles mapping
  let mainLayoutClass = "max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8";
  let leftColClass = "lg:col-span-8 space-y-12";
  let rightColClass = "lg:col-span-4 space-y-8";
  let cardClass = "bg-white rounded-2xl border border-slate-100 shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1";
  let articleGridClass = "grid grid-cols-1 md:grid-cols-2 gap-6";
  let headingStyle = "text-xl md:text-2xl font-black uppercase tracking-tight";
  let eventCardStyle = "p-5 rounded-2xl shadow-sm border border-slate-100/10 text-white transition-all hover:scale-[1.01] hover:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4";

  if (config.layoutStyle === 'minimal') {
    mainLayoutClass = "max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 gap-16 font-sans";
    leftColClass = "space-y-16";
    rightColClass = "space-y-12 border-t border-slate-200/80 pt-12";
    cardClass = "bg-transparent border-0 shadow-none p-0 space-y-4";
    articleGridClass = "grid grid-cols-1 gap-8";
    headingStyle = "text-lg font-bold tracking-widest uppercase border-b border-black/10 pb-2";
    eventCardStyle = "border-b border-black/10 pb-6 text-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:opacity-90";
  } else if (config.layoutStyle === 'classic') {
    mainLayoutClass = "max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 font-serif";
    leftColClass = "lg:col-span-7 space-y-10";
    rightColClass = "lg:col-span-5 space-y-8";
    cardClass = "bg-white p-6 border-2 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] rounded-none space-y-4";
    articleGridClass = "grid grid-cols-1 gap-6";
    headingStyle = "text-2xl font-black italic tracking-wide border-b-2 border-slate-900 pb-2";
    eventCardStyle = "border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white flex flex-col md:flex-row md:items-center justify-between gap-4";
  } else if (config.layoutStyle === 'warm') {
    mainLayoutClass = "max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8";
    leftColClass = "lg:col-span-8 space-y-10";
    rightColClass = "lg:col-span-4 space-y-8";
    cardClass = "bg-[#FCFBF7] rounded-[2rem] p-6 border border-amber-100 shadow-sm shadow-amber-50/50 space-y-4 transition-all duration-300 hover:shadow-md hover:scale-[1.005]";
    articleGridClass = "grid grid-cols-1 md:grid-cols-2 gap-6";
    headingStyle = "text-xl font-bold text-amber-900 flex items-center gap-2";
    eventCardStyle = "bg-amber-800 p-5 rounded-[1.5rem] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm";
  }

  return (
    <div 
      style={{ 
        backgroundColor: config.backgroundColor, 
        color: config.textColor,
        fontFamily: fontLink ? `"${config.fontFamily}", sans-serif` : 'inherit'
      }} 
      className="min-h-screen flex flex-col transition-colors duration-300 antialiased"
    >
      {fontLink && <link rel="stylesheet" href={fontLink} />}

      {/* Glassmorphic Top Header */}
      <header className="border-b border-black/5 bg-white/40 backdrop-blur-xl sticky top-0 z-50 transition-all duration-350">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest py-1.5 px-3.5 rounded-xl hover:bg-black/5 transition-all text-slate-655"
            style={{ color: config.primaryColor }}
          >
            <ChevronLeft className="w-4 h-4" />
            Trở lại RMS
          </Link>
          <span className="font-extrabold text-sm uppercase tracking-widest opacity-85">
            {config.restaurantName}
          </span>
          <button 
            onClick={copyPageLink}
            className="p-2 rounded-xl hover:bg-black/5 transition-all text-slate-500"
            title="Chia sẻ trang"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Immersive Cover Banner */}
      <section 
        className="h-[480px] md:h-[520px] bg-cover bg-center relative flex items-end overflow-hidden group"
        style={{ backgroundImage: `url(${config.coverImageUrl})` }}
      >
        {/* Parallax overlay background */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30 group-hover:scale-101 transition-transform duration-700 pointer-events-none"></div>
        
        {/* Abstract lights/glow */}
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto w-full px-4 pb-12 text-white space-y-4 relative z-10 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            <span 
              style={{ backgroundColor: `${config.primaryColor}dd` }}
              className="text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm"
            >
              Thương hiệu ẩm thực
            </span>
            <span className="flex items-center gap-1 text-[10px] font-black bg-amber-500 px-3 py-1 rounded-lg text-slate-950 shadow-sm animate-pulse">
              <Star className="w-3.5 h-3.5 fill-current" />
              4.9 (Tuyệt hảo)
            </span>
            <span className="flex items-center gap-1 text-[9px] font-bold bg-emerald-500/80 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-350 animate-ping"></span>
              Đang mở cửa
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-md leading-none max-w-4xl">
            {config.restaurantName}
          </h1>
          <p className="text-sm md:text-lg text-white/80 max-w-2xl leading-relaxed drop-shadow font-medium">
            {config.description}
          </p>
        </div>
      </section>

      {/* Main Grid Layout */}
      <main className={mainLayoutClass}>
        
        {/* LEFT COLUMN: ARTICLES & EVENTS */}
        <div className={leftColClass}>
          
          {/* 1. CMS ARTICLES SECTION */}
          {config.showPosts && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100" style={{ color: config.primaryColor }}>
                    <FileText className="w-5 h-5 shrink-0" />
                  </div>
                  <h2 className={headingStyle}>Bài viết & Tin tức mới</h2>
                </div>
                {articles.length > 0 && (
                  <span className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-0.5" style={{ color: config.secondaryColor }}>
                    Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              
              {articles.length === 0 ? (
                <div className="p-8 rounded-2xl bg-black/[0.01] border border-dashed border-black/5 text-center">
                  <p className="text-sm opacity-60 italic">Nhà hàng chưa cập nhật bài viết nào mới.</p>
                </div>
              ) : (
                <div className={articleGridClass}>
                  {articles.map((art) => (
                    <div key={art.id} className={cardClass}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-black/5">
                            Tin tức
                          </span>
                          <span className="text-[10px] opacity-40">
                            {new Date(art.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base leading-snug hover:underline cursor-pointer line-clamp-2">
                          {art.title}
                        </h3>
                        <p className="text-xs opacity-75 leading-relaxed line-clamp-3 whitespace-pre-wrap">
                          {art.content}
                        </p>
                      </div>
                      <div className="pt-4 border-t border-black/5 mt-4 flex items-center justify-between text-[11px] font-bold">
                        <span className="opacity-50">Tác giả: {art.createdBy}</span>
                        <span className="hover:underline flex items-center gap-0.5" style={{ color: config.primaryColor }}>
                          Chi tiết <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 2. CMS EVENTS SECTION */}
          {config.showEvents && (
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100" style={{ color: config.primaryColor }}>
                    <Calendar className="w-5 h-5 shrink-0" />
                  </div>
                  <h2 className={headingStyle}>Sự kiện & Ưu đãi đặc biệt</h2>
                </div>
                {events.length > 0 && (
                  <span className="text-xs font-bold hover:underline cursor-pointer flex items-center gap-0.5" style={{ color: config.secondaryColor }}>
                    Xem lịch trình <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {events.length === 0 ? (
                <div className="p-8 rounded-2xl bg-black/[0.01] border border-dashed border-black/5 text-center">
                  <p className="text-sm opacity-60 italic">Hiện tại chưa có sự kiện nào sắp diễn ra.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((evt) => (
                    <div 
                      key={evt.id} 
                      className={eventCardStyle}
                      style={{ 
                        backgroundColor: config.layoutStyle !== 'minimal' ? config.primaryColor : 'transparent',
                        borderColor: config.layoutStyle === 'minimal' ? 'rgba(0,0,0,0.1)' : undefined
                      }}
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        {evt.imageUrl ? (
                          <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm bg-white/5">
                            <img src={evt.imageUrl} alt={evt.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-16 rounded-xl bg-white/10 shrink-0 flex items-center justify-center font-bold text-lg border border-white/5">
                            🔥
                          </div>
                        )}
                        <div className="space-y-1.5 text-left">
                          <span 
                            style={{ color: config.layoutStyle === 'minimal' ? config.primaryColor : '#ffffff' }}
                            className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-white/20 tracking-wider inline-block"
                          >
                            Hot Event
                          </span>
                          <h3 
                            className="font-extrabold text-sm leading-tight"
                            style={{ color: config.layoutStyle === 'minimal' ? config.textColor : '#ffffff' }}
                          >
                            {evt.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] opacity-80 font-medium">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {evt.date} - {evt.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.location}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleOpenEventBooking(evt)}
                        style={{ color: config.layoutStyle === 'minimal' ? '#ffffff' : config.primaryColor, backgroundColor: config.layoutStyle === 'minimal' ? config.primaryColor : '#ffffff' }}
                        className="px-4 py-2 hover:opacity-90 font-black text-xs rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm"
                      >
                        Đăng ký ngay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>

        {/* RIGHT COLUMN: BOOKING WIDGET & REVIEWS */}
        <div className={rightColClass}>
          
          {/* 3. QUICK BOOKING WIDGET (STUNNING ADDITION) */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Utensils className="w-4 h-4" style={{ color: config.primaryColor }} />
              Đặt bàn nhanh
            </h3>
            
            <div className={cardClass}>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProceedToStep2();
                }} 
                className="space-y-4 text-left"
              >
                {branches.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-60">Chọn chi nhánh</label>
                    <select 
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                      required
                    >
                      {branches.map(b => (
                        <option key={b.branchId} value={b.branchId}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-60">Số khách</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="30"
                      value={bookingForm.guests}
                      onChange={(e) => setBookingForm({...bookingForm, guests: parseInt(e.target.value) || 2})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase opacity-60">Giờ đặt</label>
                    <select 
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
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

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60">Ngày đặt bàn</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: config.primaryColor }}
                  className="w-full text-white text-xs font-black py-3 rounded-xl shadow-md transition-all hover:brightness-105 active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Tiếp tục chọn bàn & Gọi món
                </button>
              </form>
            </div>
          </section>

          {/* 4. REVIEWS & FEEDBACK SECTION */}
          {config.showReviews && (
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: config.primaryColor }} />
                Đánh giá khách hàng
              </h3>

              {reviews.length === 0 ? (
                <div className={cardClass}>
                  <p className="text-xs opacity-60 italic text-center py-4">Chưa có đánh giá nào từ thực khách.</p>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  {reviews.map((rev) => (
                    <div 
                      key={rev.id} 
                      className={cardClass}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0"
                              style={{ backgroundColor: config.primaryColor }}
                            >
                              {rev.authorName ? rev.authorName[0] : 'U'}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold leading-none">{rev.authorName || 'Ẩn danh'}</p>
                              <p className="text-[9px] opacity-40 mt-0.5">{new Date(rev.createdAt).toLocaleDateString('vi-VN')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-black bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{rev.rating ? rev.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed italic whitespace-pre-wrap">
                          "{rev.content}"
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>

      </main>

      {/* Styled Minimalist Footer */}
      <footer 
        className="mt-auto py-10 text-center text-xs opacity-60 border-t border-black/5"
        style={{ backgroundColor: `${config.primaryColor}06` }}
      >
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p className="font-bold">© 2026 {config.restaurantName}. Bảo lưu mọi quyền.</p>
          <p className="text-[10px] opacity-60">
            Trang thông tin ẩm thực chính thức được xác thực bởi Hệ thống RMS.
          </p>
        </div>
      </footer>

      {/* 5. INTERACTIVE EVENT BOOKING MODAL */}
      {bookingEvent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-fade-in-scale max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 text-white relative" style={{ backgroundColor: config.primaryColor }}>
              <button 
                onClick={() => setBookingEvent(null)}
                className="absolute top-4 right-4 text-white/85 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">
                ĐĂNG KÝ VÉ SỰ KIỆN
              </span>
              <h3 className="text-lg font-black mt-1">Đăng ký tham gia: {bookingEvent.title}</h3>
            </div>

            {/* Modal Body */}
            {isEventBookingSuccess ? (
              <div className="p-6 text-center space-y-4 overflow-y-auto flex-1">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Đặt vé thành công!</h4>
                  <p className="text-xs text-slate-500 px-4">
                    Mã đặt vé của bạn là <strong className="text-blue-600">#{eventBookingCode}</strong>. Nhân viên nhà hàng sẽ liên hệ với bạn trong vòng 10 phút để xác nhận vé sự kiện và chỗ ngồi.
                  </p>
                </div>

                {/* Check-in QR Block */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center space-y-2 max-w-sm mx-auto">
                  <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        `=== THÔNG TIN VÉ SỰ KIỆN ===\n` +
                        `Mã vé: #${String(eventBookingCode).replace(/[^0-9]/g, '')}\n` +
                        `Sự kiện: ${bookingEvent?.title || 'Sự kiện đã chọn'}\n` +
                        `Khách hàng: ${eventBookingForm.name}\n` +
                        `Số điện thoại: ${eventBookingForm.phone}\n` +
                        `Thời gian: ${eventBookingForm.time} - ${selectedDates.map(d => d.split('-').reverse().join('/')).join(', ')}\n` +
                        `Số lượng vé: ${eventBookingForm.guests} vé\n` +
                        `Ghi chú: ${eventBookingForm.notes || 'Không có'}\n` +
                        `============================`
                      )}`}
                      alt="Check-in QR"
                      className="w-28 h-28 rounded-lg object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Mã vé Check-in của bạn</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100 text-slate-700">
                  <p><strong>Khách hàng:</strong> {eventBookingForm.name}</p>
                  <p><strong>Số điện thoại:</strong> {eventBookingForm.phone}</p>
                  <p><strong>Thời gian:</strong> {eventBookingForm.time} - {selectedDates.map(d => d.split('-').reverse().join('/')).join(', ')}</p>
                  <p><strong>Số lượng khách:</strong> {eventBookingForm.guests} người</p>
                  {eventBookingForm.notes && <p><strong>Ghi chú:</strong> {eventBookingForm.notes}</p>}
                </div>
                <button
                  onClick={() => setBookingEvent(null)}
                  className="w-full text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm hover:brightness-105"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  Hoàn tất
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmEventBooking} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={eventBookingForm.name}
                    onChange={(e) => setEventBookingForm({...eventBookingForm, name: e.target.value})}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={eventBookingForm.phone}
                    onChange={(e) => setEventBookingForm({...eventBookingForm, phone: e.target.value})}
                    placeholder="VD: 0912..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Date & Time selection */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Chọn ngày tham gia *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableDates.map(date => {
                        const isSelected = selectedDates.includes(date);
                        const displayDate = date.split('-').reverse().join('/');
                        
                        const maxCap = bookingEvent ? parseMaxCapacity(bookingEvent.capacity) : 9999;
                        const booked = dateCapacities[date] || 0;
                        const remaining = Math.max(0, maxCap - booked);

                        return (
                          <button
                            key={date}
                            type="button"
                            onClick={() => handleToggleDate(date)}
                            disabled={remaining <= 0}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex flex-col items-center ${
                              remaining <= 0
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isSelected
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'
                            }`}
                            style={{
                              backgroundColor: isSelected && remaining > 0 ? config.primaryColor : undefined,
                            }}
                          >
                            <span>{displayDate}</span>
                            <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {remaining <= 0 
                                ? 'Hết chỗ'
                                : `Còn: ${remaining}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giờ diễn ra</label>
                    <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-500 h-[34px] flex items-center">
                      {eventBookingForm.time}
                    </div>
                  </div>
                </div>

                {/* Guest Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng khách tham gia *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={eventBookingForm.guests}
                    onChange={(e) => setEventBookingForm({...eventBookingForm, guests: parseInt(e.target.value) || 2})}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yêu cầu đặc biệt hoặc ghi chú</label>
                  <textarea
                    rows={2}
                    value={eventBookingForm.notes}
                    onChange={(e) => setEventBookingForm({...eventBookingForm, notes: e.target.value})}
                    placeholder="VD: Ghế gần sân khấu, đăng ký vé VIP..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Upfront Payment Section if event is paid */}
                {bookingEvent && bookingEvent.price && !bookingEvent.price.includes('Miễn phí') && !bookingEvent.price.toLowerCase().includes('free') && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">Tổng tiền thanh toán trước *:</span>
                      <span className="font-black text-xs" style={{ color: config.primaryColor }}>
                        {(() => {
                          const singlePriceStr = bookingEvent.price.replace(/[^0-9]/g, '');
                          const singlePrice = parseInt(singlePriceStr) || 0;
                          const total = singlePrice * eventBookingForm.guests * selectedDates.length;
                          return total.toLocaleString('vi-VN') + ' đ';
                        })()}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      * Vé tham gia sự kiện ẩm thực/workshop cần được thanh toán trước 100% để đảm bảo nhà hàng giữ chỗ và chuẩn bị chu đáo.
                    </p>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500">Phương thức thanh toán</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none bg-white font-semibold text-slate-700"
                      >
                        <option value="QR_PAY">Quét mã QR Pay (VNPAY / BankTransfer)</option>
                        <option value="CARD">Thẻ ATM / Visa / Mastercard</option>
                        <option value="WALLET">Ví điện tử (Momo / ZaloPay)</option>
                      </select>
                    </div>

                    {/* Bank Transfer Details */}
                    {paymentMethod === 'QR_PAY' && bookingEvent && bookingEvent.bankAccountNo ? (
                      <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 space-y-2 text-xs font-semibold animate-fade-in text-slate-750">
                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider flex items-center gap-1">
                          <span>🏦</span> Thông tin chuyển khoản thanh toán
                        </p>
                        <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px]">
                          <span className="text-slate-450 font-bold">Ngân hàng:</span>
                          <span className="font-extrabold text-slate-800">{bookingEvent.bankName}</span>
                          
                          <span className="text-slate-450 font-bold">Số tài khoản:</span>
                          <span className="font-black text-indigo-700 select-all">{bookingEvent.bankAccountNo}</span>
                          
                          <span className="text-slate-450 font-bold">Chủ tài khoản:</span>
                          <span className="font-extrabold text-slate-800 uppercase">{bookingEvent.bankAccountName}</span>
                          
                          {bookingEvent.bankBranch && (
                            <>
                              <span className="text-slate-450 font-bold">Chi nhánh:</span>
                              <span className="font-bold text-slate-700">{bookingEvent.bankBranch}</span>
                            </>
                          )}
                        </div>
                        {/* VietQR Code Display */}
                        <div className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-dashed border-indigo-200 gap-1.5 mt-2.5 shadow-inner">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                            <span>📲</span> Quét mã VietQR để thanh toán tự động
                          </p>
                          <img 
                            src={"https://img.vietqr.io/image/" + getVietQrBankId(bookingEvent.bankName || "") + "-" + bookingEvent.bankAccountNo + "-compact.png?amount=" + ((parseInt(bookingEvent.price.replace(/[^0-9]/g, "")) || 0) * eventBookingForm.guests * selectedDates.length) + "&addInfo=" + encodeURIComponent("VE " + eventBookingForm.name.toUpperCase() + " " + eventBookingForm.phone) + "&accountName=" + encodeURIComponent(bookingEvent.bankAccountName || "")}
                            alt="VietQR Payment Code"
                            className="w-40 h-40 object-contain rounded-lg border border-slate-100 shadow-sm"
                          />
                          <p className="text-[8px] text-rose-500 font-black text-center animate-pulse">
                            * Vui lòng giữ nguyên số tiền và nội dung chuyển khoản khi quét
                          </p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium pt-1.5 border-t border-dashed border-slate-200">
                          Vui lòng ghi rõ nội dung chuyển khoản: Tên của bạn + Số điện thoại đăng ký vé.
                        </p>
                      </div>
                    ) : (
                      <div className="border-t border-dashed border-slate-200 pt-2 flex items-center gap-3">
                        <div className="h-10 w-10 border border-slate-200 rounded p-1 bg-white flex items-center justify-center shrink-0">
                          <QrCode className="h-full w-full text-slate-600" />
                        </div>
                        <div className="text-[9px] text-slate-500 font-medium">
                          <p className="font-bold text-slate-700">CỔNG THANH TOÁN RMS SECURE PAY</p>
                          <p>Quét mã để chuyển khoản thanh toán và nhận vé ngay.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookingEvent(null)}
                    className="px-4 py-2 rounded-xl text-slate-450 hover:bg-slate-100 text-xs font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:brightness-105"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    {bookingEvent && bookingEvent.price && !bookingEvent.price.includes('Miễn phí') && !bookingEvent.price.toLowerCase().includes('free')
                      ? 'Thanh toán & Xác nhận'
                      : 'Xác nhận đăng ký'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. INTERACTIVE TABLE BOOKING WIZARD MODAL */}
      {tableBookingOpen && config && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F8FAFC] rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden relative animate-fade-in-scale max-h-[95vh] flex flex-col text-slate-700">
            
            {/* Modal Header */}
            <div className="p-5 text-white relative flex justify-between items-center shrink-0" style={{ backgroundColor: config.primaryColor }}>
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded">
                  ĐẶT BÀN NÂNG CAO WIZARD
                </span>
                <h3 className="text-base font-black">Nhà hàng {config.restaurantName} - {selectedBranchName}</h3>
              </div>
              <button 
                onClick={() => {
                  setTableBookingOpen(false);
                  setTableStep(1);
                }}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Steps Progress Tracker */}
            <div className="bg-white border-b border-slate-200 py-3 shadow-inner shrink-0">
              <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-[10px] md:text-xs font-bold text-slate-400">
                <div className={`flex items-center gap-1.5 ${tableStep >= 1 ? 'text-blue-600' : ''}`}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: tableStep >= 1 ? config.primaryColor : undefined }}>1</span>
                  <span style={{ color: tableStep >= 1 ? config.primaryColor : undefined }}>Thiết lập</span>
                </div>
                <div className="h-0.5 w-10 bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${tableStep >= 2 ? 'text-blue-600' : ''}`}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: tableStep >= 2 ? config.primaryColor : undefined }}>2</span>
                  <span style={{ color: tableStep >= 2 ? config.primaryColor : undefined }}>Chọn vị trí</span>
                </div>
                <div className="h-0.5 w-10 bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${tableStep >= 3 ? 'text-blue-600' : ''}`}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: tableStep >= 3 ? config.primaryColor : undefined }}>3</span>
                  <span style={{ color: tableStep >= 3 ? config.primaryColor : undefined }}>Yêu cầu & Món</span>
                </div>
                <div className="h-0.5 w-10 bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${tableStep >= 4 ? 'text-blue-600' : ''}`}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: tableStep >= 4 ? config.primaryColor : undefined }}>4</span>
                  <span style={{ color: tableStep >= 4 ? config.primaryColor : undefined }}>Đặt cọc</span>
                </div>
                <div className="h-0.5 w-10 bg-slate-200" />
                <div className={`flex items-center gap-1.5 ${tableStep >= 5 ? 'text-emerald-600' : ''}`}>
                  <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: tableStep >= 5 ? '#10b981' : undefined }}>5</span>
                  <span style={{ color: tableStep >= 5 ? '#10b981' : undefined }}>Hoàn thành</span>
                </div>
              </div>
            </div>

            {/* Modal Body / Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 text-slate-800">
              
              {/* STEP 2: Floor Plan & Table Selection */}
              {tableStep === 2 && (
                <div>
                  {loadingFloorPlan ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <RefreshCw className="h-8 w-8 animate-spin text-slate-400" style={{ color: config.primaryColor }} />
                      <span className="text-xs text-slate-500 font-bold">Đang tải sơ đồ phòng bàn...</span>
                    </div>
                  ) : floorPlans.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6">
                      <p className="text-sm text-slate-500 font-bold">Chi nhánh này chưa cấu hình sơ đồ phòng bàn hoặc không có bàn khả dụng.</p>
                      <button
                        onClick={() => {
                          setTableBookingOpen(false);
                          setTableStep(1);
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                      >
                        Quay lại thiết lập
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                      
                      {/* Left: Floor Plan Canvas */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col overflow-x-auto">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
                          {/* Floor Plan Tabs */}
                          <div className="flex gap-2">
                            {floorPlans.map(plan => (
                              <button
                                key={plan.id}
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setSelectedTableObj(null);
                                  setSelectedTableConfirmed(false);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                  selectedPlan?.id === plan.id
                                    ? 'text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                style={{
                                  backgroundColor: selectedPlan?.id === plan.id ? config.primaryColor : undefined
                                }}
                              >
                                {plan.name}
                              </button>
                            ))}
                          </div>

                          {/* Room Filters */}
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                            {(['ALL', 'VIP', 'AC', 'OUTDOOR'] as const).map(filter => (
                              <button
                                key={filter}
                                onClick={() => setSpaceFilter(filter)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                  spaceFilter === filter
                                    ? 'bg-white shadow text-slate-900 border border-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Floor Plan Map */}
                        {selectedPlan && (
                          <div className="border border-slate-100 rounded-xl overflow-auto bg-slate-50 p-4 flex items-center justify-center relative select-none" style={{ minHeight: '380px' }}>
                            <div className="relative border border-slate-350 shadow bg-white rounded-lg overflow-hidden shrink-0" style={{ width: selectedPlan.width, height: selectedPlan.height }}>
                              
                              {/* Background Image if set */}
                              {selectedPlan.imageUrl && (
                                <img src={selectedPlan.imageUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80" alt="Background" />
                              )}

                              {/* Objects rendering */}
                              {(selectedPlan.floorPlanObjects || []).map(obj => {
                                const isTable = obj.objectType === 'table';
                                const isBooked = (obj.tableId && bookedTableIds.includes(obj.tableId)) || bookedTableIds.includes(obj.id);
                                
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
                                        outline: isSelected ? `3px solid ${config.primaryColor}` : undefined,
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
                        )}
                      </div>

                      {/* Right selection panel */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-sm text-left">Chi tiết vị trí chọn</h3>
                          <p className="text-xs text-slate-400 mt-0.5 text-left">Nhấp trực tiếp vào bàn xanh để lựa chọn</p>
                        </div>

                        {selectedTableObj && selectedPlan ? (
                          <div className="space-y-4 text-xs text-left">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-blue-900 text-sm">{selectedTableObj.label}</span>
                                <span className="bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase">
                                  Khả dụng
                                </span>
                              </div>
                              <p className="text-slate-600 font-semibold leading-relaxed">
                                Sức chứa tối đa: <span className="font-bold text-slate-900">{parsedMeta.capacity || 4} chỗ</span><br />
                                Vị trí khu vực: <span className="font-bold text-slate-900">{parsedMeta.zone || selectedPlan.name}</span>
                              </p>
                            </div>

                            {estimatedDistances && (
                              <div className="border border-slate-100 rounded-xl p-3.5 space-y-2">
                                <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Ước tính khoảng cách (Khoảng):</h4>
                                <ul className="space-y-1.5 text-slate-600 font-semibold">
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
                                className="w-full py-2.5 text-white rounded-xl font-bold transition shadow-sm"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                Xác nhận chọn bàn này
                              </button>
                            ) : (
                              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3 flex items-center gap-2 font-bold">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span>Đã khóa bàn: {selectedTableObj.label}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-6 text-center text-slate-400 text-xs py-10 font-bold">
                            Chưa có bàn nào được chọn. Vui lòng nhấp trực tiếp vào bàn trống trên sơ đồ.
                          </div>
                        )}

                        <div className="flex gap-3 border-t border-slate-100 pt-4">
                          <button
                            onClick={() => {
                              setTableBookingOpen(false);
                              setTableStep(1);
                            }}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" /> Hủy
                          </button>
                          <button
                            onClick={handleProceedToStep3}
                            disabled={!selectedTableConfirmed}
                            className="flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: config.primaryColor }}
                          >
                            Tiếp tục <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Personal Information, Dietary/Allergies & Pre-order Menu */}
              {tableStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Column: Info Form & Allergies */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Contacts info */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <h3 className="font-extrabold text-slate-900 text-base border-b border-slate-100 pb-2 text-left">1. Thông tin liên hệ</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-slate-700">Họ và tên *</label>
                          <input
                            type="text"
                            value={custName}
                            onChange={e => setCustName(e.target.value)}
                            required
                            placeholder="VD: Nguyễn Văn A"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-slate-700">Số điện thoại *</label>
                          <input
                            type="tel"
                            value={custPhone}
                            onChange={e => setCustPhone(e.target.value)}
                            required
                            placeholder="VD: 0912345678"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2 text-left">
                          <label className="text-xs font-bold text-slate-700">Địa chỉ Email (Để nhận hóa đơn/mã đặt bàn)</label>
                          <input
                            type="email"
                            value={custEmail}
                            onChange={e => setCustEmail(e.target.value)}
                            placeholder="VD: customer@gmail.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Allergies / Dietary */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-left">
                        <ShieldAlert className="h-5 w-5 text-amber-600 animate-pulse" />
                        <h3 className="font-extrabold text-slate-900 text-base">2. Yêu cầu dị ứng & ăn kiêng</h3>
                      </div>
                      
                      <div className="space-y-4 text-xs font-semibold text-slate-600 text-left">
                        <p className="text-[11px] text-slate-400 font-medium">Để bảo đảm sức khỏe và an toàn, vui lòng tick chọn nếu bạn bị dị ứng:</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allergyPeanut}
                              onChange={e => setAllergyPeanut(e.target.checked)}
                              className="h-4 w-4 text-blue-600 border-slate-350 rounded"
                            />
                            <span>Dị ứng đậu phộng / hạt</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allergyGluten}
                              onChange={e => setAllergyGluten(e.target.checked)}
                              className="h-4 w-4 text-blue-600 border-slate-355 rounded"
                            />
                            <span>Dị ứng Gluten / lúa mì</span>
                          </label>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500">Các thành phần dị ứng khác</label>
                          <input
                            type="text"
                            value={allergyOthers}
                            onChange={e => setAllergyOthers(e.target.value)}
                            placeholder="VD: Dị ứng hải sản vỏ cứng, dị ứng mật ong..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500">Ghi chú ăn kiêng hoặc ghi chú thêm</label>
                          <textarea
                            rows={2}
                            value={dietaryNotes}
                            onChange={e => setDietaryNotes(e.target.value)}
                            placeholder="VD: Ăn chay trường, không hành tỏi, ghế trẻ em..."
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pre-order menu items */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="font-extrabold text-slate-900 text-base text-left">3. Thực đơn gọi món đặt trước (Không bắt buộc)</h3>
                        <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-500 uppercase">Pre-order Menu</span>
                      </div>
                      
                      {loadingMenu ? (
                        <div className="text-center py-10 flex flex-col items-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                          <span className="text-xs text-slate-400 font-bold">Đang tải thực đơn...</span>
                        </div>
                      ) : menuItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-left py-4">Chi nhánh chưa đăng ký thực đơn bán lẻ online.</p>
                      ) : (
                        <div className="space-y-4 text-left">
                          {/* Menu categories tabs */}
                          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
                            {categories.map(cat => (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                  selectedCategory === cat
                                    ? 'text-white'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                                style={{
                                  backgroundColor: selectedCategory === cat ? config.primaryColor : undefined
                                }}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>

                          {/* Menu Items Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                            {filteredMenuItems.map(item => (
                              <div key={item.id} className="border border-slate-100 rounded-xl p-3 flex gap-2.5 hover:bg-slate-50 transition bg-white shadow-sm">
                                {item.imagePath && (
                                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-205">
                                    <img src={item.imagePath} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 flex flex-col justify-between text-xs min-w-0">
                                  <div>
                                    <h4 className="font-extrabold text-slate-900 truncate">{item.name}</h4>
                                    <p className="text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                                  </div>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="font-bold text-slate-800 text-[10px]">
                                      {item.variants?.[0]?.price?.toLocaleString('vi-VN')}đ
                                    </span>
                                    <button
                                      onClick={() => handleAddCart(item.variants?.[0], item.name)}
                                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-sm hover:brightness-105 cursor-pointer"
                                      style={{ backgroundColor: config.primaryColor }}
                                    >
                                      + Thêm
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Pre-order Cart Summary */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm text-left">Danh mục món đặt trước</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 text-left">Món ăn đã chọn sẽ được phục vụ ngay khi nhận bàn</p>
                    </div>

                    {preOrderCart.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-6 text-center text-slate-400 text-xs py-10 font-bold">
                        Chưa chọn món nào. Quý khách có thể chọn món bên danh sách hoặc tiếp tục để hoàn tất.
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs font-semibold text-slate-700">
                        <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                          {preOrderCart.map(item => (
                            <div key={item.variantId} className="flex justify-between items-center gap-2 border-b border-slate-50 pb-2">
                              <div className="min-w-0 flex-1 text-left">
                                <p className="font-extrabold text-slate-800 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {item.price.toLocaleString('vi-VN')} đ × {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => handleUpdateCartQty(item.variantId, -1)}
                                  className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 font-bold"
                                >
                                  -
                                </button>
                                <span className="text-[11px] font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateCartQty(item.variantId, 1)}
                                  className="h-5 w-5 rounded bg-slate-100 flex items-center justify-center hover:bg-slate-200 font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pricing Summary */}
                        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-[11px] text-left">
                          <div className="flex justify-between text-slate-500">
                            <span>Tạm tính món ăn:</span>
                            <span>{subtotal.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>VAT (10%):</span>
                            <span>{vat.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Phí dịch vụ bàn (5%):</span>
                            <span>{serviceCharge.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-black border-t border-dashed border-slate-200 pt-2 text-xs">
                            <span>Tổng cộng:</span>
                            <span style={{ color: config.primaryColor }}>{grandTotal.toLocaleString('vi-VN')} đ</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 border-t border-slate-100 pt-4">
                      <button
                        onClick={() => setTableStep(2)}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Quay lại
                      </button>
                      <button
                        onClick={handleProceedToStep4}
                        className="flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        Tiếp tục <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 4: Deposit & Payments */}
              {tableStep === 4 && (
                <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-slate-900">Xác nhận đặt cọc & Hoàn tất giữ bàn</h3>
                    <p className="text-xs text-slate-400 font-medium">Bảo đảm tính khả dụng của bàn trống và món gọi trước</p>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 space-y-4 text-xs font-semibold text-slate-600 text-left">
                    <div className="flex justify-between items-center text-slate-800">
                      <span>Loại bàn giữ:</span>
                      <span className="font-extrabold text-slate-900">{selectedTableObj?.label} ({selectedPlan?.name})</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-800">
                      <span>Thời gian đặt bàn:</span>
                      <span className="font-extrabold text-slate-900">
                        {bookingForm.time} ngày {bookingForm.date.split('-').reverse().join('/')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-800">
                      <span>Tổng giá trị món ăn gọi trước:</span>
                      <span className="font-extrabold text-slate-900">{grandTotal.toLocaleString('vi-VN')} đ</span>
                    </div>

                    {requireDeposit ? (
                      <div className="border-t border-dashed border-slate-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-950">Số tiền cọc giữ bàn cần đóng:</span>
                          <span className="font-black text-sm text-rose-500">100.000 đ</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-normal">
                          * Do quý khách chọn bàn VIP hoặc có gọi món đặt trước, vui lòng thanh toán cọc giữ chỗ 100.000đ. Số tiền cọc này sẽ được trừ trực tiếp vào hóa đơn thanh toán thực tế tại quán.
                        </p>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500">Phương thức thanh toán cọc</label>
                          <select
                            value={tablePaymentMethod}
                            onChange={(e) => setTablePaymentMethod(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none"
                          >
                            <option value="QR_PAY">Quét mã QR Pay (VNPAY / BankTransfer)</option>
                            <option value="CARD">Thẻ ATM / Visa / Mastercard</option>
                            <option value="WALLET">Ví điện tử (Momo / ZaloPay)</option>
                          </select>
                        </div>

                        {/* VietQR Bank info */}
                        {tablePaymentMethod === 'QR_PAY' && config && (
                          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/50 space-y-2 text-xs font-semibold text-slate-700">
                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider flex items-center gap-1">
                              🏦 Chuyển khoản ngân hàng giữ cọc
                            </p>
                            <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px]">
                              <span className="text-slate-450 font-bold">Ngân hàng:</span>
                              <span className="font-extrabold text-slate-800">Vietcombank</span>
                              
                              <span className="text-slate-450 font-bold">Số tài khoản:</span>
                              <span className="font-black text-indigo-700 select-all">1029384756</span>
                              
                              <span className="text-slate-450 font-bold">Chủ tài khoản:</span>
                              <span className="font-extrabold text-slate-800 uppercase">RMS {config.restaurantName}</span>
                            </div>

                            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-dashed border-indigo-200 gap-1.5 mt-2 shadow-inner">
                              <img 
                                src={"https://img.vietqr.io/image/vietcombank-1029384756-compact.png?amount=100000&addInfo=" + encodeURIComponent("COC BAN " + custName.toUpperCase() + " " + custPhone) + "&accountName=" + encodeURIComponent("RMS " + config.restaurantName.toUpperCase())}
                                alt="VietQR Table Deposit Code"
                                className="w-36 h-36 object-contain rounded-lg border border-slate-100 shadow-sm"
                              />
                            </div>
                          </div>
                        )}

                        <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                          <input
                            type="checkbox"
                            checked={agreedToPolicy}
                            onChange={e => setAgreedToPolicy(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-slate-300 rounded mt-0.5 shrink-0"
                          />
                          <span className="text-[10px] text-slate-450 font-medium leading-tight text-left">
                            Tôi đã đọc và đồng ý với chính sách giữ bàn, chính sách đặt cọc và hoàn trả cọc (Hoàn cọc 100% nếu hủy trước 2 tiếng).
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="border-t border-dashed border-slate-200 pt-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-3 py-1 rounded-full text-[10px] uppercase inline-block">
                          Miễn phí đặt cọc
                        </span>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Lượt đặt bàn thường của quý khách không yêu cầu đặt cọc trước.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setTableStep(3)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Quay lại
                    </button>
                    <button
                      onClick={handleConfirmAndPay}
                      disabled={isSubmittingTable}
                      className="flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      {isSubmittingTable ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Đang tạo giữ bàn...
                        </>
                      ) : requireDeposit ? (
                        'Đã thanh toán & Hoàn tất'
                      ) : (
                        'Xác nhận đặt bàn'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Success screen */}
              {tableStep === 5 && createdBooking && (
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800">Đặt bàn thành công!</h3>
                    <p className="text-xs text-slate-500">
                      Mã giữ bàn của bạn là <strong className="text-blue-600">#{createdBooking.id}</strong>. Nhân viên nhà hàng sẽ gọi điện xác nhận trong 10 phút.
                    </p>
                  </div>

                  {/* Check-in QR Block */}
                  <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center space-y-2 max-w-sm mx-auto">
                    <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                          `=== THÔNG TIN ĐẶT BÀN ===\n` +
                          `Mã đặt bàn: #${createdBooking.id}\n` +
                          `Khách hàng: ${custName}\n` +
                          `Số điện thoại: ${custPhone}\n` +
                          `Thời gian: ${bookingForm.time} ngày ${bookingForm.date.split('-').reverse().join('/')}\n` +
                          `Số lượng khách: ${bookingForm.guests} người\n` +
                          `Bàn đã khóa: Bàn ${selectedTableObj?.label || 'Chờ xếp bàn'} - ${selectedPlan?.name || ''}\n` +
                          `========================`
                        )}`}
                        alt="Check-in QR"
                        className="w-28 h-28 rounded-lg object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Mã vé Check-in của bạn</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-100 text-slate-700 font-semibold">
                    <p><strong>Khách hàng:</strong> {custName}</p>
                    <p><strong>Số điện thoại:</strong> {custPhone}</p>
                    <p><strong>Thời gian nhận bàn:</strong> {bookingForm.time} ngày {bookingForm.date.split('-').reverse().join('/')}</p>
                    <p><strong>Bàn đã khóa:</strong> Bàn {selectedTableObj?.label} - {selectedPlan?.name}</p>
                    <p><strong>Số lượng khách:</strong> {bookingForm.guests} người</p>
                    {preOrderCart.length > 0 && (
                      <p><strong>Số lượng món ăn gọi trước:</strong> {preOrderCart.length} món (Tổng: {grandTotal.toLocaleString('vi-VN')}đ)</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setTableBookingOpen(false);
                      setTableStep(1);
                      setPreOrderCart([]);
                      setSelectedTableObj(null);
                      setSelectedTableConfirmed(false);
                    }}
                    className="w-full text-white rounded-xl py-2.5 text-xs font-bold transition shadow-sm hover:brightness-105"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    Hoàn tất
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
