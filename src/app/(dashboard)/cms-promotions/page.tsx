'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Percent, 
  Shuffle, 
  Keyboard, 
  Clock, 
  Gift 
} from 'lucide-react';

export default function CmsPromotionsPage() {
  const { locale } = useLanguage();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [type, setType] = useState('PercentDiscount'); // PercentDiscount or FlatDiscount
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(0);
  
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

  const [submitting, setSubmitting] = useState(false);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/manager/promotions');
      if (data) {
        setPromotions(data as any[]);
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
        // Refresh list
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

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            {locale === 'vi' ? 'CMS QUẢN LÝ MÃ KHUYẾN MÃI' : 'PROMOTION COUPONS MANAGEMENT'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {locale === 'vi' 
              ? 'Tạo, quản lý và theo dõi hiệu lực của các mã giảm giá cho chuỗi nhà hàng của bạn.' 
              : 'Create, manage, and monitor coupon codes for your restaurant chain.'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{locale === 'vi' ? 'Tạo mã khuyến mãi' : 'Create Coupon'}</span>
        </button>
      </div>

      {/* Add Promotion Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100/80 overflow-hidden relative animate-fade-in-scale max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Tag className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {locale === 'vi' ? 'TẠO MÃ KHUYẾN MÃI MỚI' : 'CREATE NEW PROMOTION'}
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
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  {locale === 'vi' ? 'Tên chương trình khuyến mãi *' : 'Promotion Name *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                  placeholder={locale === 'vi' ? 'Ví dụ: Tri ân cuối tuần giảm 10%' : 'e.g. Weekend Special 10% Off'}
                  required
                />
              </div>

              {/* Code Selection */}
              <div className="space-y-2">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  {locale === 'vi' ? 'Cấu hình mã code *' : 'Coupon Code Configuration *'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${
                    !autoGenerate ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
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
                    autoGenerate ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
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
                <div className="space-y-1 animate-fade-in">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    {locale === 'vi' ? 'Nhập mã Code *' : 'Enter Code *'}
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 uppercase text-sm transition font-black"
                    placeholder="Ví dụ: SALE10"
                    required={!autoGenerate}
                  />
                </div>
              )}

              {/* Discount Type */}
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                  {locale === 'vi' ? 'Loại giảm giá *' : 'Discount Type *'}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                >
                  <option value="PercentDiscount">{locale === 'vi' ? 'Giảm theo phần trăm (%)' : 'Percentage discount (%)'}</option>
                  <option value="FlatDiscount">{locale === 'vi' ? 'Giảm số tiền cố định (đ)' : 'Flat amount discount (VND)'}</option>
                </select>
              </div>

              {/* Discount Value & Min Order Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">
                    {locale === 'vi' ? 'Giá trị giảm giá *' : 'Discount Value *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
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
                      className="w-full pl-3 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
                      min={0}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="text-xs font-bold">đ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{locale === 'vi' ? 'Ngày bắt đầu *' : 'Start Date *'}</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
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
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-sm transition"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
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

      {/* Coupons Table Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 pb-4 border-b border-slate-100 text-left">
          {locale === 'vi' ? 'DANH SÁCH MÃ GIẢM GIÁ HOẠT ĐỘNG' : 'ACTIVE COUPONS LIST'}
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-slate-400 text-xs font-semibold">
              {locale === 'vi' ? 'Đang tải danh sách khuyến mãi...' : 'Loading promotions...'}
            </span>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-2">
            <Tag className="w-8 h-8 mx-auto text-slate-300 animate-pulse" />
            <p className="text-xs font-semibold">
              {locale === 'vi' ? 'Chưa có mã khuyến mãi nào được tạo.' : 'No promotions created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">{locale === 'vi' ? 'Mã Code' : 'Promo Code'}</th>
                  <th className="py-3 px-4">{locale === 'vi' ? 'Tên chương trình' : 'Campaign Name'}</th>
                  <th className="py-3 px-4">{locale === 'vi' ? 'Loại' : 'Type'}</th>
                  <th className="py-3 px-4">{locale === 'vi' ? 'Giá trị' : 'Value'}</th>
                  <th className="py-3 px-4">{locale === 'vi' ? 'Đơn hàng tối thiểu' : 'Min Order'}</th>
                  <th className="py-3 px-4">{locale === 'vi' ? 'Ngày bắt đầu' : 'Start Date'}</th>
                  <th className="py-3 px-4">{locale === 'vi' ? 'Ngày kết thúc' : 'End Date'}</th>
                  <th className="py-3 px-4 text-right">{locale === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <span className="bg-blue-50 border border-blue-150 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {p.promoCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {p.type === 'PercentDiscount' 
                        ? (locale === 'vi' ? 'Giảm phần trăm' : 'Percentage') 
                        : (locale === 'vi' ? 'Giảm tiền mặt' : 'Flat amount')}
                    </td>
                    <td className="py-3.5 px-4 text-blue-650 font-black">
                      {p.type === 'PercentDiscount' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()}đ`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-550">
                      {p.minOrderValue > 0 ? `${p.minOrderValue.toLocaleString()}đ` : '0đ'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.startDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.endDate).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeletePromotion(p.id)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition cursor-pointer"
                        title={locale === 'vi' ? 'Xóa mã' : 'Delete Code'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

// Minimal X component since it is imported and needed
function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
