'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Plus, Edit, Trash2, Calendar, MapPin, Users, Info, Sparkles, Check, Image as ImageIcon, RefreshCw, X, Award, Tag
} from 'lucide-react';

interface EventDto {
  id?: number;
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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  commissionRate?: number;
  isUsingSystemWeb?: boolean;
  bookingDeadline?: string | null;
  createdBy?: string;
}

export default function CmsEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDto | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [tag, setTag] = useState<EventDto['tag']>('Festival');
  const [price, setPrice] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState('');
  const [branchId, setBranchId] = useState('');
  const [eventDates, setEventDates] = useState('');
  const [bookingDeadline, setBookingDeadline] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // AI Banner Scaler states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number; reason?: string } | null>(null);

  const isAdmin = user?.roles.includes('ADMIN');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Admin sees all, cooperator/manager sees their own
      const url = isAdmin ? '/api/events/admin/all' : '/api/events/my';
      const data = await api.get(url);
      setEvents(data as EventDto[]);
    } catch (err: any) {
      toast.error('Không thể tải danh sách sự kiện: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('');
    setLocation('');
    setRestaurantName('');
    setTag('Festival');
    setPrice('');
    setCapacity('');
    setDescription('');
    setHighlights('');
    setBranchId(user?.branchId || '');
    setEventDates('');
    setBookingDeadline('');
    setImageUrl('');
    setSelectedFile(null);
    setImagePreview(null);
    setCropBox(null);
    setEditingEvent(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (evt: EventDto) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDate(evt.date);
    setTime(evt.time);
    setLocation(evt.location);
    setRestaurantName(evt.restaurantName);
    setTag(evt.tag);
    setPrice(evt.price);
    setCapacity(evt.capacity);
    setDescription(evt.description);
    setHighlights(evt.highlights.join(';'));
    setBranchId(evt.branchId);
    setEventDates(evt.eventDates.join(','));
    setBookingDeadline(evt.bookingDeadline ? new Date(evt.bookingDeadline).toISOString().slice(0, 16) : '');
    setImageUrl(evt.imageUrl);
    setSelectedFile(null);
    setImagePreview(null);
    setCropBox(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date.trim() || !location.trim() || !restaurantName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    const payload: EventDto = {
      title: title.trim(),
      date: date.trim(),
      time: time.trim(),
      location: location.trim(),
      restaurantName: restaurantName.trim(),
      tag,
      price: price.trim() || 'Miễn phí',
      capacity: capacity.trim() || 'Không giới hạn',
      description: description.trim(),
      highlights: highlights.split(';').map(h => h.trim()).filter(Boolean),
      branchId: branchId.trim(),
      eventDates: eventDates.split(',').map(d => d.trim()).filter(Boolean),
      bookingDeadline: bookingDeadline ? bookingDeadline : null,
      imageUrl: imageUrl.trim()
    };

    try {
      if (editingEvent?.id) {
        await api.put(`/api/events/${editingEvent.id}`, payload);
        toast.success('Cập nhật sự kiện thành công.');
      } else {
        await api.post('/api/events', payload);
        toast.success('Tạo sự kiện thành công.');
      }
      setModalOpen(false);
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu sự kiện.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này không?')) return;
    try {
      await api.delete(`/api/events/${id}`);
      toast.success('Xóa sự kiện thành công.');
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa sự kiện.');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/api/events/${id}/approve`);
      toast.success('Phê duyệt sự kiện thành công.');
      loadEvents();
    } catch (err: any) {
      toast.error('Lỗi phê duyệt: ' + err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/api/events/${id}/reject`);
      toast.success('Đã từ chối phê duyệt sự kiện.');
      loadEvents();
    } catch (err: any) {
      toast.error('Lỗi từ chối: ' + err.message);
    }
  };

  // Upload and analyze banner
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setCropBox(null);
    }
  };

  const triggerAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Call AI analyze endpoint
      const result = await api.postMultipart<{ x: number; y: number; width: number; height: number; reason?: string }>(
        '/api/admin/ai/events/banner/analyze', formData);
      setCropBox(result);
      toast.success('AI phân tích vùng cắt 16:9 tối ưu thành công.');
    } catch (err: any) {
      toast.error('AI phân tích ảnh thất bại: ' + err.message);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const applyCropAndScale = async () => {
    if (!selectedFile || !cropBox) return;
    setOptimizingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('x', cropBox.x.toString());
      formData.append('y', cropBox.y.toString());
      formData.append('width', cropBox.width.toString());
      formData.append('height', cropBox.height.toString());
      formData.append('targetWidth', '1200');
      formData.append('targetHeight', '675');

      // Call crop/compress endpoint
      const result = await api.postMultipart<{ url: string }>('/api/admin/ai/events/banner/optimize', formData);
      setImageUrl(result.url);
      toast.success('Đã áp dụng cắt ảnh và nén dung lượng tối ưu bằng AI.');
      setSelectedFile(null);
      setImagePreview(null);
      setCropBox(null);
    } catch (err: any) {
      toast.error('Lỗi xử lý ảnh: ' + err.message);
    } finally {
      setOptimizingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            CMS Quản Lý Sự Kiện & Chiến Dịch
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Vận hành sự kiện ẩm thực, đêm nhạc, chương trình ưu đãi, tích hợp tính năng đặt bàn chi nhánh.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-md shadow-indigo-100 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tạo sự kiện mới
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-slate-500 text-sm mt-3">Đang tải danh sách sự kiện...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">Chưa có sự kiện nào</h3>
          <p className="text-slate-400 text-sm mt-1">Bắt đầu quảng bá sự kiện đầu tiên của nhà hàng ngay hôm nay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Event Image */}
              <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                {evt.imageUrl ? (
                  <img src={evt.imageUrl.startsWith('/') ? `http://localhost:8080${evt.imageUrl}` : evt.imageUrl} alt={evt.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full bg-slate-900/60 text-white font-bold text-[10px] uppercase backdrop-blur-sm">
                  {evt.tag}
                </span>
                
                {/* Status indicator */}
                <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full font-bold text-[10px] border backdrop-blur-sm ${
                  evt.status === 'APPROVED' ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100' :
                  evt.status === 'REJECTED' ? 'bg-rose-50/80 text-rose-600 border-rose-100' :
                  'bg-amber-50/80 text-amber-600 border-amber-100'
                }`}>
                  {evt.status === 'APPROVED' ? 'Đã duyệt' :
                   evt.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                </span>
              </div>

              {/* Event Details */}
              <div className="p-5 flex-1 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-slate-800 text-lg leading-snug truncate" title={evt.title}>
                    {evt.title}
                  </h3>
                  <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500" />{evt.date} ({evt.time})</p>
                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" />{evt.location} - {evt.restaurantName}</p>
                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" />Sức chứa: {evt.capacity} người</p>
                    <p className="flex items-center gap-2"><Tag className="w-4 h-4 text-indigo-500" />Giá vé: <strong>{evt.price}</strong></p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                  {/* Reservation link */}
                  {evt.bookingDeadline ? (
                    <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 text-[10px] text-indigo-600">
                      Đăng ký đặt trước hạn chót: <strong>{new Date(evt.bookingDeadline).toLocaleString('vi-VN')}</strong>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500">
                      Không giới hạn thời gian đặt bàn.
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-400">ID: #{evt.id}</span>
                    <div className="flex gap-2">
                      {/* Approve / Reject buttons for Admin */}
                      {isAdmin && evt.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => evt.id && handleApprove(evt.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => evt.id && handleReject(evt.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleOpenEdit(evt)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => evt.id && handleDelete(evt.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">
                {editingEvent ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-4">
              
              {/* Event Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Tên sự kiện / Chiến dịch *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tên sự kiện..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none text-sm font-medium"
                  required
                />
              </div>

              {/* Grid 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Thời gian (Khoảng ngày) *</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Ví dụ: 15/07/2026 hoặc Hằng tuần"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Giờ diễn ra *</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="Ví dụ: 18:30 - 21:30"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              {/* Grid 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Địa điểm diễn ra *</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ví dụ: Tầng 3, Chi nhánh 2/9"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Tên nhà hàng *</label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Ví dụ: Liteflow Cuisine"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              {/* Tag & Branch */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Phân loại (Tag)</label>
                  <select
                    value={tag}
                    onChange={(e) => setTag(e.target.value as EventDto['tag'])}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Festival">Festival</option>
                    <option value="Fine Dining">Fine Dining</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Mã Chi Nhánh áp dụng</label>
                  <input
                    type="text"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    placeholder="Mã chi nhánh (Ví dụ: 01-2thang9)..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Price & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Giá vé tham gia</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ví dụ: 200.000 đ hoặc Miễn phí"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Sức chứa tối đa (người)</label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Ví dụ: 50"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Mô tả sự kiện</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả sự kiện..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm leading-relaxed"
                />
              </div>

              {/* Highlights */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Điểm nổi bật (Cách nhau bởi dấu chấm phẩy ;)</label>
                <input
                  type="text"
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  placeholder="Đêm nhạc Trịnh;Tặng welcome drink;Menu buffet 15 món"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              {/* Event Dates & Booking Deadline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Danh sách các ngày (Cách nhau bởi dấu phẩy ,)</label>
                  <input
                    type="text"
                    value={eventDates}
                    onChange={(e) => setEventDates(e.target.value)}
                    placeholder="2026-07-15,2026-07-16"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Hạn chót đặt bàn (Booking Deadline)</label>
                  <input
                    type="datetime-local"
                    value={bookingDeadline}
                    onChange={(e) => setBookingDeadline(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Banner Upload with AI Scaler */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase block">Banner sự kiện (AI Scaler & Compressor)</label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-1/3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-400 bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <ImageIcon className="w-5 h-5" />
                      Chọn ảnh tải lên
                    </button>
                  </div>

                  <div className="w-full sm:w-2/3 space-y-2">
                    {/* Raw uploaded preview */}
                    {imagePreview && (
                      <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-center">
                        <span className="text-[10px] text-slate-400 block">Ảnh gốc tải lên</span>
                        <img src={imagePreview} alt="Preview" className="max-h-36 mx-auto object-contain rounded border border-slate-200" />
                        
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={triggerAnalyze}
                            disabled={analyzingImage}
                            className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 hover:scale-[1.02] cursor-pointer"
                          >
                            {analyzingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            AI Phân tích Bố cục (16:9)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Proposed coordinates box */}
                    {cropBox && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                        <p className="font-extrabold text-indigo-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          Khung cắt tỉ lệ 16:9 đề xuất bởi AI:
                        </p>
                        <p className="text-slate-600 text-[10px]">
                          <strong>Giải thích:</strong> {cropBox.reason || 'Tránh xén chữ và tập trung vào đối tượng chính.'}
                        </p>
                        <p className="text-slate-500 font-mono text-[9px]">
                          Tọa độ: x={cropBox.x}, y={cropBox.y}, w={cropBox.width}, h={cropBox.height}
                        </p>
                        <button
                          type="button"
                          onClick={applyCropAndScale}
                          disabled={optimizingImage}
                          className="w-full py-1.5 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer text-[10px]"
                        >
                          {optimizingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Áp dụng & Tối ưu hóa ảnh (Nén & Cắt)
                        </button>
                      </div>
                    )}

                    {/* Active Saved URL */}
                    {imageUrl && (
                      <div className="flex items-center justify-between p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 text-xs gap-3">
                        <span className="truncate font-medium">Link đã lưu: {imageUrl}</span>
                        <button type="button" onClick={() => setImageUrl('')} className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-md cursor-pointer"
                >
                  {editingEvent ? 'Cập nhật' : 'Đăng sự kiện'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
