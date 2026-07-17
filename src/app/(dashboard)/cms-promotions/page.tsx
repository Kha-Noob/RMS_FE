'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Calendar, 
  Percent, 
  Shuffle, 
  Keyboard, 
  Clock, 
  Gift,
  Search,
  Filter,
  CheckCircle,
  Copy,
  TrendingUp,
  X
} from 'lucide-react';

interface Promotion {
  id: number;
  name: string;
  promoCode: string;
  type: 'PercentDiscount' | 'FlatDiscount';
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function CmsPromotionsPage() {
  const { locale } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'PercentDiscount' | 'FlatDiscount'>('all');

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [type, setType] = useState('PercentDiscount'); // PercentDiscount or FlatDiscount
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Date states default to today and +30 days
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    return future.toISOString().split('T')[0];
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await api.get<Promotion[]>('/api/manager/promotions');
      if (data) {
        setPromotions(data);
      }
    } catch (err: any) {
      console.error('Failed to load promotions:', err);
      toast.error(locale === 'vi' ? 'Không thể tải danh sách khuyến mãi.' : 'Failed to load promotions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập tên chương trình.' : 'Please enter promotion name.');
      return;
    }
    if (!autoGenerate && !promoCode.trim()) {
      toast.error(locale === 'vi' ? 'Vui lòng nhập mã khuyến mãi.' : 'Please enter promo code.');
      return;
    }
    if (discountValue <= 0) {
      toast.error(locale === 'vi' ? 'Giá trị giảm giá phải lớn hơn 0.' : 'Discount value must be greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        promoCode: autoGenerate ? '' : promoCode.trim().toUpperCase(),
        autoGenerate,
        type,
        discountValue,
        minOrderValue,
        startDate,
        endDate
      };

      const res = await api.post('/api/manager/promotions', payload);
      if (res) {
        toast.success(locale === 'vi' ? 'Tạo mã khuyến mãi thành công!' : 'Promotion created successfully!');
        // Reset form
        setName('');
        setPromoCode('');
        setAutoGenerate(false);
        setDiscountValue(10);
        setMinOrderValue(0);
        setShowAddForm(false);
        fetchPromotions();
      }
    } catch (err: any) {
      console.error('Failed to create promotion:', err);
      toast.error(err.message || (locale === 'vi' ? 'Lỗi tạo mã khuyến mãi.' : 'Failed to create promotion.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm(locale === 'vi' ? 'Bạn có chắc chắn muốn xóa mã khuyến mãi này?' : 'Are you sure you want to delete this promotion?')) {
      return;
    }
    try {
      await api.delete(`/api/manager/promotions/${id}`);
      toast.success(locale === 'vi' ? 'Đã xóa mã khuyến mãi.' : 'Promotion deleted.');
      fetchPromotions();
    } catch (err: any) {
      console.error('Failed to delete promotion:', err);
      toast.error(locale === 'vi' ? 'Không thể xóa mã khuyến mãi.' : 'Failed to delete promotion.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(locale === 'vi' ? `Đã sao chép mã: ${code}` : `Copied code: ${code}`);
  };

  // ── Stats Calculations ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = promotions.length;
    const percentCount = promotions.filter(p => p.type === 'PercentDiscount').length;
    const flatCount = promotions.filter(p => p.type === 'FlatDiscount').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const activeCount = promotions.filter(p => p.startDate <= todayStr && p.endDate >= todayStr).length;

    return { total, percentCount, flatCount, activeCount };
  }, [promotions]);

  // ── Filtering Logic ────────────────────────────────────────────────────────
  const filteredPromotions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return promotions.filter(p => {
      // Search match
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.promoCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type match
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      
      // Status match
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = p.startDate <= todayStr && p.endDate >= todayStr;
      } else if (statusFilter === 'upcoming') {
        matchesStatus = p.startDate > todayStr;
      } else if (statusFilter === 'expired') {
        matchesStatus = p.endDate < todayStr;
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [promotions, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-600" />
            {locale === 'vi' ? 'QUẢN LÝ MÃ KHUYẾN MÃI' : 'PROMOTIONS & COUPONS'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === 'vi' 
              ? 'Tạo, quản lý và theo dõi hiệu lực của các mã giảm giá cho chuỗi nhà hàng.' 
              : 'Create, manage, and monitor coupon codes for your restaurant chain.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{locale === 'vi' ? 'Tạo mã khuyến mãi' : 'Create Coupon'}</span>
        </button>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng chương trình</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang diễn ra</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.activeCount}</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã phần trăm (%)</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.percentCount}</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mã tiền mặt (đ)</p>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{stats.flatCount}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={locale === 'vi' ? 'Tìm tên chương trình hoặc mã code...' : 'Search campaigns or codes...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600/30 focus:border-indigo-600/50"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{locale === 'vi' ? 'Trạng thái' : 'Status'}</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-650 focus:outline-none font-bold"
            >
              <option value="all">{locale === 'vi' ? 'Tất cả' : 'All Statuses'}</option>
              <option value="active">{locale === 'vi' ? 'Đang diễn ra' : 'Active'}</option>
              <option value="upcoming">{locale === 'vi' ? 'Sắp diễn ra' : 'Upcoming'}</option>
              <option value="expired">{locale === 'vi' ? 'Hết hạn' : 'Expired'}</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{locale === 'vi' ? 'Loại mã' : 'Type'}</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-2 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-650 focus:outline-none font-bold"
            >
              <option value="all">{locale === 'vi' ? 'Tất cả loại' : 'All Types'}</option>
              <option value="PercentDiscount">{locale === 'vi' ? 'Phần trăm (%)' : 'Percentage (%)'}</option>
              <option value="FlatDiscount">{locale === 'vi' ? 'Tiền mặt (đ)' : 'Flat Cash (VND)'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Voucher Ticket Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-slate-400 text-xs font-semibold">
            {locale === 'vi' ? 'Đang tải danh sách khuyến mãi...' : 'Loading coupons...'}
          </span>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-3">
          <Tag className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
          <p className="text-xs font-bold text-slate-400">
            {locale === 'vi' ? 'Không tìm thấy mã khuyến mãi nào.' : 'No promotions match search filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPromotions.map((p) => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isExpired = p.endDate < todayStr;
            const isUpcoming = p.startDate > todayStr;
            const isActive = !isExpired && !isUpcoming;

            const daysLeft = isExpired 
              ? 0 
              : Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <div 
                key={p.id}
                className="relative bg-white border border-slate-100 rounded-2xl shadow-sm flex items-stretch overflow-hidden group hover:shadow-md transition-all duration-300 min-h-[135px]"
              >
                {/* Left Side: Value Gradient Accent */}
                <div className={`w-32 flex flex-col items-center justify-center text-white px-2 py-4 relative select-none bg-gradient-to-br ${
                  p.type === 'PercentDiscount' 
                    ? 'from-indigo-500 to-indigo-700' 
                    : 'from-emerald-500 to-teal-600'
                }`}>
                  <div className="absolute top-0 right-0 -mt-6 -mr-6 w-14 h-14 bg-white/10 rounded-full" />
                  
                  {p.type === 'PercentDiscount' ? (
                    <span className="text-3xl font-black tracking-tight">{p.discountValue}%</span>
                  ) : (
                    <span className="text-xl font-black tracking-tight">{(p.discountValue / 1000).toFixed(0)}k</span>
                  )}
                  <span className="text-[9px] font-extrabold uppercase opacity-85 tracking-widest mt-1">
                    {p.type === 'PercentDiscount' ? 'GIẢM GIÁ' : 'TIỀN MẶT'}
                  </span>
                </div>

                {/* Perforated Separator Line */}
                <div className="w-4 relative flex flex-col justify-between items-center bg-white border-r border-dashed border-slate-200 py-1.5 -ml-2">
                  <div className="w-4 h-4 bg-slate-50 border border-slate-100 rounded-full -mt-3.5 absolute top-0 z-10" />
                  <div className="w-4 h-4 bg-slate-50 border border-slate-100 rounded-full -mb-3.5 absolute bottom-0 z-10" />
                </div>

                {/* Right Side: Details & Actions */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-150">
                        {p.minOrderValue > 0 ? `Đơn từ ${(p.minOrderValue / 1000).toFixed(0)}k` : 'Đơn tối thiểu 0đ'}
                      </span>
                      
                      {isActive && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-emerald-50 text-emerald-700 uppercase tracking-widest animate-pulse">
                          {locale === 'vi' ? 'Hoạt động' : 'Active'}
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-blue-50 text-blue-700 uppercase tracking-widest">
                          {locale === 'vi' ? 'Sắp mở' : 'Upcoming'}
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-slate-100 text-slate-400 uppercase tracking-widest">
                          {locale === 'vi' ? 'Hết hạn' : 'Expired'}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-xs font-black text-slate-800 line-clamp-1">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Hạn: {new Date(p.endDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-1">
                    {/* Copy Token Button */}
                    <button 
                      onClick={() => handleCopyCode(p.promoCode)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-650 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1 cursor-pointer"
                      title={locale === 'vi' ? 'Click để copy' : 'Click to copy'}
                    >
                      <Copy className="w-3 h-3" />
                      <span>{p.promoCode}</span>
                    </button>

                    {/* Delete action */}
                    <button
                      onClick={() => handleDeletePromotion(p.id)}
                      className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title={locale === 'vi' ? 'Xóa mã' : 'Delete Code'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Days left count */}
                {isActive && daysLeft > 0 && (
                  <div className="absolute top-2 right-2 bg-indigo-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    Còn {daysLeft} ngày
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Promotion Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100/80 overflow-hidden relative animate-fade-in-scale max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Tag className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 uppercase">
                  {locale === 'vi' ? 'Tạo mã khuyến mãi mới' : 'Create New Promotion'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreatePromotion} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Name */}
              <div className="space-y-1 text-left">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  {locale === 'vi' ? 'Tên chương trình khuyến mãi *' : 'Promotion Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-sm transition"
                  placeholder={locale === 'vi' ? 'Ví dụ: Tri ân cuối tuần giảm 10%' : 'e.g. Weekend Special 10% Off'}
                  required
                />
              </div>

              {/* Code Selection */}
              <div className="space-y-2 text-left">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  {locale === 'vi' ? 'Cấu hình mã code *' : 'Coupon Code Configuration *'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${
                    !autoGenerate ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="codeMode" 
                      checked={!autoGenerate}
                      onChange={() => setAutoGenerate(false)}
                      className="hidden"
                    />
                    <Keyboard className="w-4 h-4" />
                    <span className="font-bold text-xs">{locale === 'vi' ? 'Tự nhập mã' : 'Custom Code'}</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${
                    autoGenerate ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input 
                      type="radio" 
                      name="codeMode" 
                      checked={autoGenerate}
                      onChange={() => setAutoGenerate(true)}
                      className="hidden"
                    />
                    <Shuffle className="w-4 h-4" />
                    <span className="font-bold text-xs">{locale === 'vi' ? 'Sinh ngẫu nhiên' : 'Random Code'}</span>
                  </label>
                </div>
              </div>

              {/* Code Input */}
              {!autoGenerate && (
                <div className="space-y-1 animate-fade-in text-left">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    {locale === 'vi' ? 'Nhập mã Code *' : 'Enter Code *'}
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 uppercase text-sm transition font-black"
                    placeholder="Ví dụ: SALE10"
                    required={!autoGenerate}
                  />
                </div>
              )}

              {/* Discount Type */}
              <div className="space-y-1 text-left">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  {locale === 'vi' ? 'Loại giảm giá *' : 'Discount Type *'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-sm transition"
                >
                  <option value="PercentDiscount">{locale === 'vi' ? 'Giảm theo phần trăm (%)' : 'Percentage discount (%)'}</option>
                  <option value="FlatDiscount">{locale === 'vi' ? 'Giảm số tiền cố định (đ)' : 'Flat amount discount (VND)'}</option>
                </select>
              </div>

              {/* Discount Value & Min Order Value */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    {locale === 'vi' ? 'Giá trị giảm giá *' : 'Discount Value *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-sm transition"
                      required
                      min={1}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {type === 'PercentDiscount' ? <Percent className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">đ</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    {locale === 'vi' ? 'Đơn hàng tối thiểu' : 'Min Order Value'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-sm transition"
                      min={0}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="text-xs font-bold">đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{locale === 'vi' ? 'Ngày bắt đầu *' : 'Start Date *'}</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-sm transition"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{locale === 'vi' ? 'Ngày kết thúc *' : 'End Date *'}</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 text-sm transition"
                    required
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold transition cursor-pointer"
                >
                  {locale === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{locale === 'vi' ? 'Kích hoạt mã' : 'Activate Code'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

