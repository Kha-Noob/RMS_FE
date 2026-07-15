'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Percent, 
  Globe, 
  Info, 
  Tag as TagIcon,
  Calendar,
  Clock,
  MapPin,
  Users
} from 'lucide-react';

interface EventDto {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  restaurantName: string;
  tag: 'Festival' | 'Fine Dining' | 'Workshop';
  imageUrl: string;
  price: string;
  capacity: string;
  description: string;
  highlights: string[];
  branchId: string;
  eventDates: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  commissionRate: number;
  isUsingSystemWeb: boolean;
  bookingDeadline?: string | null;
  createdBy: string;
}

function EventBillingInfo({ eventId, locale }: { eventId: number; locale: string }) {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/events/${eventId}/billing`)
      .then(res => {
        setBilling(res);
      })
      .catch(err => {
        console.error('Failed to load billing', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [eventId]);

  if (loading) {
    return <div className="text-[10px] text-slate-400 py-1">{locale === 'vi' ? 'Đang tải hóa đơn...' : 'Loading invoice...'}</div>;
  }

  if (!billing) return null;

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-left text-xs">
      <div className="flex justify-between items-center pb-1 border-b border-dashed border-slate-200">
        <span className="font-extrabold text-slate-700">
          {locale === 'vi' ? 'Hóa đơn & Phí hoa hồng' : 'Commission Invoice'}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
          billing.isExpired 
            ? 'bg-rose-50 text-rose-600 border border-rose-100'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {billing.isExpired ? (locale === 'vi' ? 'Hết hạn' : 'Settled') : (locale === 'vi' ? 'Đang mở' : 'Active')}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-y-0.5 text-[10px] font-medium text-slate-500">
        <div>{locale === 'vi' ? 'Vé đã bán:' : 'Tickets Sold:'}</div>
        <div className="text-right font-bold text-slate-800">{billing.totalTickets} {locale === 'vi' ? 'vé' : 'tickets'}</div>

        <div>{locale === 'vi' ? 'Giá vé:' : 'Ticket Price:'}</div>
        <div className="text-right font-bold text-slate-800">
          {billing.ticketPrice > 0 ? billing.ticketPrice.toLocaleString('vi-VN') + ' đ' : (locale === 'vi' ? 'Miễn phí' : 'Free')}
        </div>

        <div>{locale === 'vi' ? 'Doanh thu:' : 'Total Revenue:'}</div>
        <div className="text-right font-bold text-slate-800">{billing.totalRevenue.toLocaleString('vi-VN')} đ</div>

        <div className="text-indigo-650 font-bold">{locale === 'vi' ? 'Phí hoa hồng:' : 'Commission Fee:'}</div>
        <div className="text-right font-black text-indigo-700 bg-indigo-50 px-1 rounded shrink-0">
          {billing.commissionAmount.toLocaleString('vi-VN')} đ ({billing.commissionRate}%)
        </div>
      </div>
    </div>
  );
}

const POPULAR_BANKS = [
  { code: 'vietcombank', name: 'Vietcombank', fullName: 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)', logo: 'https://api.vietqr.io/images/VCB.png' },
  { code: 'techcombank', name: 'Techcombank', fullName: 'Ngân hàng Kỹ Thương Việt Nam (Techcombank)', logo: 'https://api.vietqr.io/images/TCB.png' },
  { code: 'vietinbank', name: 'Vietinbank', fullName: 'Ngân hàng Công Thương Việt Nam (Vietinbank)', logo: 'https://api.vietqr.io/images/CTG.png' },
  { code: 'bidv', name: 'BIDV', fullName: 'Ngân hàng Đầu tư và Phát triển Việt Nam (BIDV)', logo: 'https://api.vietqr.io/images/BIDV.png' },
  { code: 'agribank', name: 'Agribank', fullName: 'Ngân hàng Nông nghiệp & Phát triển Nông thôn (Agribank)', logo: 'https://api.vietqr.io/images/VARB.png' },
  { code: 'mb', name: 'MBBank', fullName: 'Ngân hàng Quân Đội (MBBank)', logo: 'https://api.vietqr.io/images/MB.png' },
  { code: 'acb', name: 'ACB', fullName: 'Ngân hàng Á Châu (ACB)', logo: 'https://api.vietqr.io/images/ACB.png' },
  { code: 'tpbank', name: 'TPBank', fullName: 'Ngân hàng Tiên Phong (TPBank)', logo: 'https://api.vietqr.io/images/TPB.png' },
  { code: 'vpbank', name: 'VPBank', fullName: 'Ngân hàng Thịnh Vượng (VPBank)', logo: 'https://api.vietqr.io/images/VPB.png' },
  { code: 'sacombank', name: 'Sacombank', fullName: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)', logo: 'https://api.vietqr.io/images/STB.png' },
  { code: 'hdbank', name: 'HDBank', fullName: 'Ngân hàng Phát triển TP.HCM (HDBank)', logo: 'https://api.vietqr.io/images/HDB.png' },
  { code: 'shb', name: 'SHB', fullName: 'Ngân hàng Sài Gòn - Hà Nội (SHB)', logo: 'https://api.vietqr.io/images/SHB.png' },
  { code: 'vib', name: 'VIB', fullName: 'Ngân hàng Quốc tế (VIB)', logo: 'https://api.vietqr.io/images/VIB.png' },
];

const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default function MyRestaurantPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  // Redirect if not authorized
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const hasAccess = user.roles.some(r => ['ADMIN', 'COOPERATOR'].includes(r));
    if (!hasAccess) {
      toast.error(locale === 'vi' ? 'Bạn không có quyền truy cập trang này!' : 'Access Denied!');
      router.push('/');
    }
  }, [user]);

  const isAdmin = user?.roles.includes('ADMIN') || false;
  const isCooperator = user?.roles.includes('COOPERATOR') || false;

  // States
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'approvals' | 'bank' | 'bookings'>('list');

  // Bank configuration states
  const [bankData, setBankData] = useState({
    bankName: '',
    bankAccountNo: '',
    bankAccountName: '',
    bankBranch: ''
  });
  const [loadingBank, setLoadingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchBankQuery, setSearchBankQuery] = useState('');

  // Event Bookings states
  const [eventBookings, setEventBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedEventIdForDetails, setSelectedEventIdForDetails] = useState<number | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Handle click outside of bank name dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const el = document.getElementById('bank-name-dropdown-container');
      if (el && !el.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load bank settings
  const loadBankSetting = () => {
    setLoadingBank(true);
    api.get('/api/cooperator/tenant/bank')
      .then((res: any) => {
        setBankData({
          bankName: res.bankName || '',
          bankAccountNo: res.bankAccountNo || '',
          bankAccountName: res.bankAccountName || '',
          bankBranch: res.bankBranch || ''
        });
      })
      .catch(err => {
        console.error('Failed to load bank settings', err);
      })
      .finally(() => {
        setLoadingBank(false);
      });
  };

  useEffect(() => {
    if (user && activeTab === 'bank') {
      loadBankSetting();
    }
  }, [user, activeTab]);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    api.put('/api/cooperator/tenant/bank', bankData)
      .then(() => {
        toast.success(locale === 'vi' ? 'Cập nhật cấu hình tài khoản ngân hàng thành công!' : 'Bank account updated successfully!');
      })
      .catch(err => {
        console.error('Failed to save bank settings', err);
        toast.error(locale === 'vi' ? 'Cập nhật thất bại!' : 'Failed to update bank account!');
      })
      .finally(() => {
        setSavingBank(false);
      });
  };

  const loadEventBookings = useCallback(() => {
    setLoadingBookings(true);
    api.get('/api/events/cooperator/bookings-summary')
      .then((res: any) => {
        setEventBookings(res || []);
      })
      .catch(err => {
        console.error('Failed to load event bookings summary', err);
        toast.error(locale === 'vi' ? 'Không thể tải lịch sử đặt vé.' : 'Failed to load booking summary.');
      })
      .finally(() => {
        setLoadingBookings(false);
      });
  }, [locale]);

  const loadBookingDetails = (eventId: number) => {
    setLoadingDetails(true);
    setSelectedEventIdForDetails(eventId);
    setShowDetailsModal(true);
    api.get(`/api/events/cooperator/bookings/${eventId}/details`)
      .then((res: any) => {
        setBookingDetails(res || []);
      })
      .catch(err => {
        console.error('Failed to load booking details', err);
        toast.error(locale === 'vi' ? 'Không thể tải chi tiết danh sách vé.' : 'Failed to load booking details.');
        setShowDetailsModal(false);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  };

  const handleConfirmBookingPayment = (bookingId: number) => {
    api.put(`/api/public/bookings/${bookingId}/confirm-payment`, {})
      .then(() => {
        toast.success(locale === 'vi' ? 'Đã xác nhận thanh toán thành công!' : 'Payment confirmed successfully!');
        if (selectedEventIdForDetails) {
          loadBookingDetails(selectedEventIdForDetails);
        }
        loadEventBookings();
      })
      .catch(err => {
        console.error('Failed to confirm payment', err);
        toast.error('Failed to confirm payment');
      });
  };

  useEffect(() => {
    if (user && activeTab === 'bookings') {
      loadEventBookings();
    }
  }, [user, activeTab, loadEventBookings]);
  
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    restaurantName: '',
    tag: 'Festival' as 'Festival' | 'Fine Dining' | 'Workshop',
    imageUrl: '',
    price: '',
    capacity: '',
    description: '',
    highlights: '', // input as semicolon-separated
    branchId: '01-2thang9',
    eventDates: '', // input as comma-separated
    bookingDeadline: '',
    isUsingSystemWeb: user?.isUsingSystemWeb || user?.roles.includes('ADMIN') || false
  });

  const branches = [
    { id: '01-2thang9', name: 'Chi nhánh 2 Tháng 9, Hải Châu, Đà Nẵng' },
    { id: '11-NguyenHuuTho', name: 'Chi nhánh Nguyễn Hữu Thọ, Hải Châu, Đà Nẵng' },
    { id: '21-HaiPhong', name: 'Chi nhánh Hải Phòng, Thạch Thang, Đà Nẵng' }
  ];

  // Fetch events
  const loadEvents = () => {
    setLoading(true);
    const url = isAdmin ? '/api/events/admin/all' : '/api/events/my';
    api.get<EventDto[]>(url)
      .then(res => {
        setEvents(res);
      })
      .catch(err => {
        console.error('Failed to load events', err);
        toast.error(locale === 'vi' ? 'Không thể tải danh sách sự kiện' : 'Failed to load events list');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date.trim() || !formData.time.trim() || !formData.location.trim() || !formData.restaurantName.trim() || !formData.price.trim() || !formData.capacity.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng điền đầy đủ các trường bắt buộc!' : 'Please fill all required fields!');
      return;
    }

    const payload = {
      ...formData,
      branchId: formData.isUsingSystemWeb ? formData.branchId : '',
      highlights: formData.highlights, // backend splits this
      eventDates: formData.eventDates
    };

    const promise = editingId 
      ? api.put<EventDto>(`/api/events/${editingId}`, payload)
      : api.post<EventDto>('/api/events', payload);

    promise
      .then(() => {
        toast.success(editingId 
          ? (locale === 'vi' ? 'Cập nhật sự kiện thành công!' : 'Event updated successfully!')
          : (locale === 'vi' ? 'Tạo sự kiện thành công!' : 'Event created successfully!')
        );
        resetForm();
        loadEvents();
        setActiveTab('list');
      })
      .catch(err => {
        console.error('Submit event failed', err);
        toast.error(locale === 'vi' ? 'Thao tác thất bại!' : 'Failed to submit event!');
      });
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      date: '',
      time: '',
      location: '',
      restaurantName: '',
      tag: 'Festival',
      imageUrl: '',
      price: '',
      capacity: '',
      description: '',
      highlights: '',
      branchId: '01-2thang9',
      eventDates: '',
      bookingDeadline: '',
      isUsingSystemWeb: user?.isUsingSystemWeb || user?.roles.includes('ADMIN') || false
    });
  };

  // Edit action
  const handleEdit = (event: EventDto) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      restaurantName: event.restaurantName,
      tag: event.tag,
      imageUrl: event.imageUrl,
      price: event.price,
      capacity: event.capacity,
      description: event.description || '',
      highlights: Array.isArray(event.highlights) ? event.highlights.join(';') : '',
      branchId: event.branchId || '01-2thang9',
      eventDates: Array.isArray(event.eventDates) ? event.eventDates.join(',') : '',
      bookingDeadline: event.bookingDeadline ? event.bookingDeadline.substring(0, 16) : '',
      isUsingSystemWeb: event.isUsingSystemWeb
    });
    setActiveTab('form');
  };

  // Delete action
  const handleDelete = (id: number) => {
    if (!window.confirm(locale === 'vi' ? 'Bạn chắc chắn muốn xóa sự kiện này?' : 'Are you sure you want to delete this event?')) {
      return;
    }
    api.delete(`/api/events/${id}`)
      .then(() => {
        toast.success(locale === 'vi' ? 'Xóa sự kiện thành công!' : 'Event deleted successfully!');
        loadEvents();
      })
      .catch(err => {
        console.error('Delete failed', err);
        toast.error(locale === 'vi' ? 'Không thể xóa sự kiện!' : 'Failed to delete event!');
      });
  };

  // Approve action (Admin only)
  const handleApprove = (id: number) => {
    api.post(`/api/events/${id}/approve`, {})
      .then(() => {
        toast.success(locale === 'vi' ? 'Đã duyệt sự kiện thành công!' : 'Event approved successfully!');
        loadEvents();
      })
      .catch(err => {
        console.error('Approve failed', err);
        toast.error('Failed to approve event');
      });
  };

  // Reject action (Admin only)
  const handleReject = (id: number) => {
    api.post(`/api/events/${id}/reject`, {})
      .then(() => {
        toast.success(locale === 'vi' ? 'Đã từ chối duyệt sự kiện!' : 'Event rejected successfully!');
        loadEvents();
      })
      .catch(err => {
        console.error('Reject failed', err);
        toast.error('Failed to reject event');
      });
  };

  // Filtered lists
  const pendingEvents = useMemo(() => events.filter(e => e.status === 'PENDING'), [events]);
  const approvedEvents = useMemo(() => events.filter(e => e.status === 'APPROVED'), [events]);
  const rejectedEvents = useMemo(() => events.filter(e => e.status === 'REJECTED'), [events]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 mt-4">
        
        {/* Banner header dashboard */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-755 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-2">
            <span className="bg-white/20 text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full backdrop-blur-sm">
              {isAdmin ? (locale === 'vi' ? 'Khu vực quản trị hệ thống' : 'System Administration Area') : (locale === 'vi' ? 'Đối tác quảng cáo & dịch vụ' : 'Promotional Partner Portal')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              {locale === 'vi' ? 'Nhà hàng của tôi - Sự kiện & Quảng cáo' : 'My Restaurant - Event Campaign Center'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl font-medium leading-relaxed">
              {locale === 'vi' 
                ? 'Đăng tải các sự kiện ẩm thực độc quyền, quản lý chiến dịch quảng cáo và xem mức phí hoa hồng ưu đãi đối với các chủ nhà hàng liên kết sử dụng hệ thống web của RMS.' 
                : 'Publish premium dining events, manage advertising campaigns, and review customized commission rates for collaborative restaurants using RMS web products.'}
            </p>
          </div>
        </div>

        {/* Dashboard Tabs & Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-0.5 shrink-0 self-start">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {locale === 'vi' ? 'Danh sách sự kiện' : 'All Events'} ({events.length})
            </button>
            <button
              onClick={() => {
                resetForm();
                setActiveTab('form');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === 'form' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {editingId ? (locale === 'vi' ? 'Sửa sự kiện' : 'Edit Event') : (locale === 'vi' ? 'Tạo sự kiện mới' : 'Create Event')}
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition relative ${activeTab === 'approvals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {locale === 'vi' ? 'Duyệt bài đăng' : 'Pending Approvals'}
                {pendingEvents.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center animate-pulse">
                    {pendingEvents.length}
                  </span>
                )}
              </button>
            )}
            {isCooperator && (
              <button
                onClick={() => setActiveTab('bank')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === 'bank' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {locale === 'vi' ? '🏦 Tài khoản ngân hàng' : '🏦 Bank Account'}
              </button>
            )}
            {isCooperator && (
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition ${activeTab === 'bookings' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {locale === 'vi' ? '🎫 Lịch sử đặt vé' : '🎫 Booking History'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-sm text-xs font-semibold text-slate-650">
            <Globe className="h-4.5 w-4.5 text-blue-500" />
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{locale === 'vi' ? 'Hoa hồng ưu đãi' : 'Commission Level'}</span>
              <span>{locale === 'vi' ? '5% (Dùng Web)' : '5% (RMS Web)'} | {locale === 'vi' ? '10% (Chỉ quảng cáo)' : '10% (Ads only)'}</span>
            </div>
          </div>
        </div>

        {/* Tab 1: Event List */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-xs text-slate-400 animate-pulse">
                {locale === 'vi' ? 'Đang tải dữ liệu chiến dịch...' : 'Loading advertising campaigns...'}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3">
                <div className="text-3xl">🗓️</div>
                <h3 className="font-extrabold text-slate-700 text-sm">{locale === 'vi' ? 'Không tìm thấy sự kiện nào' : 'No events found'}</h3>
                <p className="text-xs text-slate-450 max-w-md mx-auto">
                  {locale === 'vi' 
                    ? 'Bạn chưa tạo sự kiện nào hoặc các sự kiện đang chờ hệ thống nạp dữ liệu. Bấm nút Tạo sự kiện mới để đăng chiến dịch quảng bá đầu tiên của bạn.'
                    : 'You haven\'t created any events yet. Click Create Event to publish your first dining campaign.'}
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('form');
                  }}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition"
                >
                  {locale === 'vi' ? 'Tạo sự kiện ngay' : 'Create First Event'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt) => (
                  <div key={evt.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col h-full">
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-[1px] ${
                        evt.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        evt.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {evt.status === 'APPROVED' ? (locale === 'vi' ? 'ĐÃ DUYỆT' : 'APPROVED') :
                         evt.status === 'PENDING' ? (locale === 'vi' ? 'ĐANG CHỜ' : 'PENDING') :
                         (locale === 'vi' ? 'BỊ TỪ CHỐI' : 'REJECTED')}
                      </span>
                    </div>

                    {/* Image Header */}
                    <div className="h-44 w-full relative bg-slate-100 overflow-hidden shrink-0">
                      <img 
                        src={evt.imageUrl || 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=600'} 
                        alt={evt.title} 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {evt.tag}
                      </div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 flex-1 flex flex-col space-y-4">
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {evt.restaurantName}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {evt.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {evt.description || (locale === 'vi' ? 'Không có mô tả chi tiết.' : 'No description available.')}
                        </p>
                      </div>

                      {/* Info Pills */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{evt.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{evt.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      </div>

                      {/* Commission Invoice Info */}
                      <EventBillingInfo eventId={evt.id} locale={locale} />

                      {/* CRUD Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-55 mt-auto">
                        <button
                          onClick={() => handleEdit(evt)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-100 hover:border-blue-100 transition"
                          title={locale === 'vi' ? 'Chỉnh sửa' : 'Edit Event'}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(evt.id)}
                          className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg border border-slate-100 hover:border-rose-100 transition"
                          title={locale === 'vi' ? 'Xóa sự kiện' : 'Delete Event'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {isAdmin && evt.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(evt.id)}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                              title={locale === 'vi' ? 'Duyệt bài đăng' : 'Approve Event'}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleReject(evt.id)}
                              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                              title={locale === 'vi' ? 'Từ chối duyệt' : 'Reject Event'}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create/Edit Form */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 max-w-3xl mx-auto shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-800">
                {editingId ? (locale === 'vi' ? 'Cập nhật sự kiện của bạn' : 'Edit Event Details') : (locale === 'vi' ? 'Tạo chiến dịch quảng bá ẩm thực' : 'Create Promotional Event Campaign')}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                {locale === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
            </div>
            {user?.isUsingSystemWeb && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3 text-xs text-indigo-800">
                <span className="text-sm">✨</span>
                <div>
                  <p className="font-extrabold text-slate-800">
                    {locale === 'vi' ? 'Sử dụng AI tối ưu hóa sự kiện' : 'Optimize Events with AI Power'}
                  </p>
                  <p className="text-slate-500 font-semibold mt-0.5 leading-relaxed">
                    {locale === 'vi' 
                      ? 'Hệ thống hỗ trợ công cụ AI tự tạo ảnh banner đúng chuẩn và viết mô tả sự kiện hấp dẫn. Hãy chuyển qua trang '
                      : 'We support AI features to auto-scale banners and generate premium descriptions. Switch to '}
                    <Link href="/cms-events" className="text-indigo-600 hover:text-indigo-800 hover:underline font-extrabold">
                      {locale === 'vi' ? 'CMS Sự Kiện' : 'CMS Events'}
                    </Link>
                    {locale === 'vi' ? ' trên thanh công cụ để sử dụng.' : ' on Sidebar to use.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
              
              {/* Basic Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Tên sự kiện *' : 'Event Title *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Đêm Hội Rượu Vang Thượng Hạng"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Tên nhà hàng tổ chức *' : 'Organizing Restaurant *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Skyline Lounge"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Chọn loại sự kiện *' : 'Event Category *'}</label>
                  <select
                    value={formData.tag}
                    onChange={(e) => setFormData({...formData, tag: e.target.value as any})}
                    className="w-full p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none"
                  >
                    <option value="Festival">{locale === 'vi' ? 'Lễ hội (Festival)' : 'Festival'}</option>
                    <option value="Fine Dining">{locale === 'vi' ? 'Bữa tiệc cao cấp (Fine Dining)' : 'Fine Dining'}</option>
                    <option value="Workshop">{locale === 'vi' ? 'Lớp học nấu ăn (Workshop)' : 'Workshop'}</option>
                  </select>
                </div>

                {formData.isUsingSystemWeb ? (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Chi nhánh hợp tác *' : 'Affiliated Branch *'}</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                      className="w-full p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Chi nhánh hợp tác' : 'Affiliated Branch'}</label>
                    <input
                      type="text"
                      disabled
                      value={locale === 'vi' ? 'Không (Chiến dịch quảng cáo ngoài)' : 'None (External advertising campaign)'}
                      className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-xl text-slate-400 cursor-not-allowed"
                    />
                  </div>
                )}
              </div>

              {/* Time and location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Chuỗi ngày diễn ra (hiển thị) *' : 'Display Date Range *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 18/07 - 19/07/2026"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Giờ diễn ra *' : 'Time Range *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 18:00 - 21:00"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Địa điểm cụ thể *' : 'Exact Location *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Tầng 2, 2 Tháng 9, Hải Châu, Đà Nẵng"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Ticket details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Giá vé *' : 'Ticket Price *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 500.000đ / khách"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Sức chứa tối đa *' : 'Maximum Capacity *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. 40 khách"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Organised dates list */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-500">
                  {locale === 'vi' ? 'Các ngày tổ chức cụ thể (Dấu phẩy ngăn cách - dùng để đặt bàn) *' : 'Specific Organized Dates (Comma separated ISO format) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. 2026-07-18,2026-07-19"
                  value={formData.eventDates}
                  onChange={(e) => setFormData({...formData, eventDates: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50 font-mono"
                />
              </div>

              {/* Booking Deadline */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-500">
                  {locale === 'vi' ? 'Hạn đăng ký vé sự kiện *' : 'Ticket Booking Deadline *'}
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.bookingDeadline}
                  onChange={(e) => setFormData({...formData, bookingDeadline: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Image URL & Highlights */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Ảnh đại diện sự kiện (Link ảnh Unsplash)' : 'Event Banner Image URL'}</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500">
                  {locale === 'vi' ? 'Điểm nổi bật (Dấu chấm phẩy ngăn cách ";")' : 'Key Highlights (Semicolon separated ";")'}
                </label>
                <input
                  type="text"
                  placeholder="E.g. Nguyên liệu cá hồi tươi sống;Đầy đủ thức uống kèm theo;Bếp trưởng 15 năm kinh nghiệm"
                  value={formData.highlights}
                  onChange={(e) => setFormData({...formData, highlights: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Mô tả chi tiết sự kiện' : 'Full Campaign Description'}</label>
                <textarea
                  rows={4}
                  placeholder={locale === 'vi' ? 'Mô tả chi tiết về thực đơn, chương trình âm nhạc hoặc hoạt động trải nghiệm...' : 'Write detailed event structure, fine dining courses, musical bands...'}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 resize-none"
                />
              </div>

              {/* Cooperator Commission Toggling Policy (Auto Detected) */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4.5 w-4.5 text-indigo-500" />
                    <span className="font-extrabold text-slate-800">{locale === 'vi' ? 'Chính sách tính phí hoa hồng' : 'Commission Fee Policy'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    {locale === 'vi'
                      ? 'Mức phí hoa hồng được hệ thống tự động xác định dựa trên trạng thái hợp tác của tài khoản của bạn (5.0% đối với các chuỗi sử dụng Web/POS RMS và 10.0% đối với các chiến dịch quảng cáo ngoài).'
                      : 'The commission rate is automatically determined based on your account integration status (5.0% for chains using RMS Web/POS and 10.0% for external advertising campaigns).'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    formData.isUsingSystemWeb 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}>
                    {locale === 'vi' ? 'Hệ thống nhận diện:' : 'Detected Status:'} {formData.isUsingSystemWeb ? (locale === 'vi' ? 'Liên kết RMS (5.0%)' : 'RMS Linked (5.0%)') : (locale === 'vi' ? 'Quảng cáo ngoài (10.0%)' : 'Ads Only (10.0%)')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('list');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold transition"
                >
                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm transition"
                >
                  {editingId ? (locale === 'vi' ? 'Lưu cập nhật' : 'Save Changes') : (locale === 'vi' ? 'Đăng sự kiện' : 'Publish Event')}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Tab 3: Approvals (Admin only) */}
        {activeTab === 'approvals' && isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-800">
                {locale === 'vi' ? 'Sự kiện đối tác đang chờ phê duyệt' : 'Pending Cooperator Ad Submissions'} ({pendingEvents.length})
              </h2>
            </div>

            {pendingEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2 text-xs text-slate-400">
                <div className="text-3xl">🎉</div>
                <p className="font-bold text-slate-650">{locale === 'vi' ? 'Không có sự kiện nào đang chờ duyệt!' : 'No pending events to review!'}</p>
                <p>{locale === 'vi' ? 'Tất cả các bài đăng của đối tác đã được xử lý sạch sẽ.' : 'All collaborative posts have been fully processed.'}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                        <th className="p-4">{locale === 'vi' ? 'Người đăng / Nhà hàng' : 'Author / Restaurant'}</th>
                        <th className="p-4">{locale === 'vi' ? 'Sự kiện' : 'Event Campaign'}</th>
                        <th className="p-4">{locale === 'vi' ? 'Thời gian & Địa điểm' : 'Schedule & Location'}</th>
                        <th className="p-4">{locale === 'vi' ? 'Hợp tác Web' : 'Linked Web'}</th>
                        <th className="p-4 text-center">{locale === 'vi' ? 'Thu Hoa Hồng' : 'Commission'}</th>
                        <th className="p-4 text-right">{locale === 'vi' ? 'Thao tác phê duyệt' : 'Approval Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {pendingEvents.map((evt) => (
                        <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <span className="block font-bold text-slate-800">{evt.restaurantName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{evt.createdBy}</span>
                          </td>
                          <td className="p-4 max-w-xs">
                            <span className="block font-black text-slate-800 text-sm line-clamp-1">{evt.title}</span>
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">{evt.tag}</span>
                          </td>
                          <td className="p-4">
                            <span className="block">{evt.date} ({evt.time})</span>
                            <span className="text-[10px] text-slate-450 block truncate max-w-xs">{evt.location}</span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center text-[10px] font-bold ${evt.isUsingSystemWeb ? 'text-emerald-600' : 'text-slate-450'}`}>
                              {evt.isUsingSystemWeb ? 'RMS Web App' : 'No (Ads Only)'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-extrabold text-slate-800">{evt.commissionRate}%</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(evt.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>{locale === 'vi' ? 'Duyệt' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleReject(evt.id)}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl transition inline-flex items-center gap-1.5"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>{locale === 'vi' ? 'Từ chối' : 'Reject'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Bank Account Settings (Cooperator only) */}
        {activeTab === 'bank' && isCooperator && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm max-w-xl mx-auto space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800">
                {locale === 'vi' ? '🏦 Cấu hình tài khoản ngân hàng nhận tiền' : '🏦 Configure Payee Bank Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {locale === 'vi' 
                  ? 'Tài khoản này được dùng để nhận tiền chuyển khoản đặt cọc sự kiện và thanh toán hóa đơn từ khách hàng.'
                  : 'This account is used to receive event booking deposits and digital bill payments from customers.'}
              </p>
            </div>

            {loadingBank ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                {locale === 'vi' ? 'Đang tải cấu hình ngân hàng...' : 'Loading bank configuration...'}
              </div>
            ) : (
              <form onSubmit={handleBankSubmit} className="space-y-4">
                {/* Custom Search Select Dropdown for Bank Name (US#1) */}
                <div className="space-y-1 relative" id="bank-name-dropdown-container">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Tên ngân hàng *' : 'Bank Name *'}</label>
                  
                  <div 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition h-[42px]"
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const matchedBank = POPULAR_BANKS.find(b => b.name.toLowerCase() === bankData.bankName.toLowerCase() || b.fullName.toLowerCase() === bankData.bankName.toLowerCase());
                        if (matchedBank) {
                          return (
                            <>
                              <img src={matchedBank.logo} alt={matchedBank.name} className="w-6 h-6 object-contain" />
                              <span className="font-semibold text-slate-800 text-xs">{matchedBank.fullName}</span>
                            </>
                          );
                        }
                        return (
                          <span className="text-slate-400 text-xs">
                            {bankData.bankName || (locale === 'vi' ? 'Chọn ngân hàng hoặc gõ để tìm...' : 'Select a bank...')}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-slate-400 text-xs">▼</span>
                  </div>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-2 animate-fade-in max-h-64 overflow-y-auto">
                      <input
                        type="text"
                        placeholder={locale === 'vi' ? 'Tìm kiếm ngân hàng...' : 'Search bank...'}
                        value={searchBankQuery}
                        onChange={(e) => setSearchBankQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full p-2 border border-slate-250 rounded-lg text-xs focus:outline-none bg-white text-slate-800"
                      />
                      <div className="divide-y divide-slate-100 overflow-y-auto max-h-44">
                        {POPULAR_BANKS.filter(b => 
                          b.name.toLowerCase().includes(searchBankQuery.toLowerCase()) || 
                          b.fullName.toLowerCase().includes(searchBankQuery.toLowerCase())
                        ).map(b => (
                          <div
                            key={b.code}
                            onClick={() => {
                              setBankData({...bankData, bankName: b.name.toUpperCase()});
                              setDropdownOpen(false);
                              setSearchBankQuery('');
                            }}
                            className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer transition text-xs font-semibold text-slate-700"
                          >
                            <img src={b.logo} alt={b.name} className="w-8 h-8 object-contain shrink-0 rounded bg-white p-0.5 border border-slate-100" />
                            <div className="text-left">
                              <p className="font-extrabold text-slate-800">{b.name}</p>
                              <p className="text-[10px] text-slate-400">{b.fullName}</p>
                            </div>
                          </div>
                        ))}
                        {/* Custom option */}
                        <div className="p-2 pt-3 border-t border-slate-100">
                          <p className="text-[10px] text-slate-400 mb-1.5">{locale === 'vi' ? 'Hoặc nhập tên ngân hàng khác:' : 'Or enter custom bank name:'}</p>
                          <input
                            type="text"
                            placeholder="VD: MARITIME BANK, KIENLONGBANK..."
                            value={bankData.bankName}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setBankData({...bankData, bankName: e.target.value.toUpperCase()})}
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50/50 text-slate-850 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Số tài khoản ngân hàng *' : 'Account Number *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 1012938475"
                    value={bankData.bankAccountNo}
                    onChange={(e) => setBankData({...bankData, bankAccountNo: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50 text-slate-800 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Tên chủ tài khoản (Viết hoa không dấu) *' : 'Account Holder Name *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: NGUYEN VAN A"
                    value={bankData.bankAccountName}
                    onChange={(e) => setBankData({...bankData, bankAccountName: removeVietnameseTones(e.target.value).toUpperCase()})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50 text-slate-800 font-extrabold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-500">{locale === 'vi' ? 'Chi nhánh ngân hàng' : 'Bank Branch'}</label>
                  <input
                    type="text"
                    placeholder="VD: CHI NHANH BA DINH, HA NOI"
                    value={bankData.bankBranch}
                    onChange={(e) => setBankData({...bankData, bankBranch: e.target.value.toUpperCase()})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50 text-slate-800 font-semibold"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-sm transition disabled:opacity-50"
                  >
                    {savingBank ? (locale === 'vi' ? 'Đang lưu...' : 'Saving...') : (locale === 'vi' ? 'Lưu cấu hình' : 'Save Configuration')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 5: Booking History (Cooperator only) */}
        {activeTab === 'bookings' && isCooperator && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800">
                {locale === 'vi' ? '🎫 Lịch sử đặt vé sự kiện của chuỗi' : '🎫 Event Ticket Booking History'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {locale === 'vi' 
                  ? 'Xem tổng quan số lượng khách hàng đặt vé và doanh thu trên từng sự kiện.'
                  : 'Overview of booked tickets and revenue for each event.'}
              </p>
            </div>

            {loadingBookings ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                {locale === 'vi' ? 'Đang tải lịch sử đặt vé...' : 'Loading booking history...'}
              </div>
            ) : eventBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                {locale === 'vi' ? 'Chưa có sự kiện nào được đăng ký.' : 'No registered events found.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs font-semibold text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100">
                      <th className="p-4">{locale === 'vi' ? 'Tên sự kiện' : 'Event Title'}</th>
                      <th className="p-4">{locale === 'vi' ? 'Ngày diễn ra' : 'Date'}</th>
                      <th className="p-4">{locale === 'vi' ? 'Giờ' : 'Time'}</th>
                      <th className="p-4">{locale === 'vi' ? 'Giá vé' : 'Price'}</th>
                      <th className="p-4 text-center">{locale === 'vi' ? 'Vé đã đặt' : 'Booked Tickets'}</th>
                      <th className="p-4 text-right">{locale === 'vi' ? 'Tiền thu được' : 'Amount Collected'}</th>
                      <th className="p-4 text-center">{locale === 'vi' ? 'Hành động' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {eventBookings.map((eb) => (
                      <tr key={eb.eventId} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-bold text-slate-800">{eb.title}</td>
                        <td className="p-4 text-slate-500">{eb.date}</td>
                        <td className="p-4 text-slate-500">{eb.time}</td>
                        <td className="p-4 text-blue-600 font-extrabold">{eb.price}</td>
                        <td className="p-4 text-center">
                          <span className="bg-blue-50 text-blue-700 font-extrabold px-2.5 py-1 rounded-full text-[11px]">
                            {eb.bookedCount}
                          </span>
                        </td>
                        <td className="p-4 text-right font-extrabold text-emerald-600">
                          {eb.totalPaid.toLocaleString()}đ
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => loadBookingDetails(eb.eventId)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-lg text-[10px] transition shadow-sm"
                          >
                            {locale === 'vi' ? 'Xem danh sách đặt vé' : 'View Bookings'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Booking Details (Invoices) */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-xl overflow-hidden animate-scale-in flex flex-col my-8 max-h-[85vh]">
              <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black">
                    {locale === 'vi' ? '🎫 Chi tiết danh sách khách hàng đặt vé' : '🎫 Detailed Customer Bookings List'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {locale === 'vi' 
                      ? 'Danh sách hoá đơn ghi nhận thông tin đặt chỗ và lịch sử thanh toán.'
                      : 'Invoice list recording reservation details and payment history.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-slate-400 hover:text-white transition text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {loadingDetails ? (
                  <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                    {locale === 'vi' ? 'Đang tải danh sách vé...' : 'Loading ticket list...'}
                  </div>
                ) : bookingDetails.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    {locale === 'vi' ? 'Chưa có lượt khách hàng nào đặt vé cho sự kiện này.' : 'No bookings registered for this event yet.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-xs font-semibold text-slate-650 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100">
                          <th className="p-3">{locale === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                          <th className="p-3">{locale === 'vi' ? 'Gmail / SĐT' : 'Email / Phone'}</th>
                          <th className="p-3">{locale === 'vi' ? 'Thời gian đặt' : 'Booking Time'}</th>
                          <th className="p-3 text-center">{locale === 'vi' ? 'Số lượng' : 'Quantity'}</th>
                          <th className="p-3 text-right">{locale === 'vi' ? 'Số tiền' : 'Amount'}</th>
                          <th className="p-3 text-center">{locale === 'vi' ? 'Thanh toán' : 'Payment'}</th>
                          <th className="p-3 text-center">{locale === 'vi' ? 'Trạng thái đơn' : 'Booking Status'}</th>
                          <th className="p-3 text-center">{locale === 'vi' ? 'Thao tác' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {bookingDetails.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/30 transition">
                            <td className="p-3">
                              <span className="block font-bold text-slate-800">{b.customerName}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Mã: #{b.id}</span>
                            </td>
                            <td className="p-3">
                              <span className="block text-slate-600 font-medium">{b.customerEmail || 'N/A'}</span>
                              <span className="block text-[11px] text-slate-400 font-bold">{b.customerPhone}</span>
                            </td>
                            <td className="p-3 text-slate-500">
                              {new Date(b.bookingTime).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3 text-center font-extrabold text-slate-800">
                              {b.guests}
                            </td>
                            <td className="p-3 text-right font-extrabold text-slate-800">
                              {b.depositAmount ? `${b.depositAmount.toLocaleString()}đ` : '0đ'}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.paymentStatus === 'PAID' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {b.paymentStatus === 'PAID' ? (locale === 'vi' ? 'Đã thu' : 'Paid') : (locale === 'vi' ? 'Chưa thu' : 'Pending')}
                              </span>
                              {b.paymentMethod && (
                                <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                  {b.paymentMethod}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
                                  ? 'bg-blue-50 text-blue-700'
                                  : b.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {b.paymentStatus !== 'PAID' ? (
                                <button
                                  onClick={() => handleConfirmBookingPayment(b.id)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-lg text-[9px] transition shadow-sm cursor-pointer"
                                >
                                  {locale === 'vi' ? 'Xác nhận chuyển khoản' : 'Confirm Payment'}
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-bold">✓ {locale === 'vi' ? 'Đã hoàn tất' : 'Done'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs transition shadow-sm"
                >
                  {locale === 'vi' ? 'Đóng' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
