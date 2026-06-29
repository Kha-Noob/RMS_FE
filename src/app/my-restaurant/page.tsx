'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  createdBy: string;
}

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
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'approvals'>('list');
  
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

                      {/* Commission Rates & Policy Info */}
                      <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-indigo-500" />
                          <div>
                            <span className="block text-[9px] text-slate-400 font-bold uppercase">{locale === 'vi' ? 'Phí hoa hồng' : 'Commission Fee'}</span>
                            <span className="font-bold text-slate-800">{evt.commissionRate}%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[9px] text-slate-400 font-bold uppercase">{locale === 'vi' ? 'Hợp tác Web' : 'Linked Web'}</span>
                          <span className={`inline-flex items-center text-[10px] font-extrabold ${evt.isUsingSystemWeb ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {evt.isUsingSystemWeb ? (locale === 'vi' ? 'Có' : 'Yes') : (locale === 'vi' ? 'Không' : 'No')}
                          </span>
                        </div>
                      </div>

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

      </main>

      <Footer />
    </div>
  );
}
