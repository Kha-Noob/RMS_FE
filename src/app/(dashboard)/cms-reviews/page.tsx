'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Star, MessageSquare, ThumbsUp, ThumbsDown, Globe, Sparkles, Check, CheckCircle2, RefreshCw, Send, Plus, Filter, LayoutGrid
} from 'lucide-react';

interface CustomerReview {
  id: number;
  customerName: string;
  customerPhone?: string;
  rating: number;
  comment?: string;
  orderId?: number;
  branchId: string;
  source: 'SYSTEM' | 'GOOGLE_MAPS' | 'FACEBOOK' | 'TRIPADVISOR';
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  responseEn?: string;
  responseVi?: string;
  isApproved: boolean;
  createdAt: string;
}

export default function CmsReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterSentiment, setFilterSentiment] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');

  // Editing reply states
  const [replyingReviewId, setReplyingReviewId] = useState<number | null>(null);
  const [customReplyVi, setCustomReplyVi] = useState('');
  const [customReplyEn, setCustomReplyEn] = useState('');
  const [activeLangTab, setActiveLangTab] = useState<'vi' | 'en'>('vi');

  // Ingestion Widget states
  const [showIngest, setShowIngest] = useState(false);
  const [mockName, setMockName] = useState('');
  const [mockPhone, setMockPhone] = useState('');
  const [mockRating, setMockRating] = useState(5);
  const [mockComment, setMockComment] = useState('');
  const [mockSource, setMockSource] = useState('GOOGLE_MAPS');
  const [mockBranch, setMockBranch] = useState(user?.branchId || '01-2thang9');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [filterRating, filterSentiment, filterSource]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (filterRating) query += `rating=${filterRating}&`;
      if (filterSentiment) query += `sentiment=${filterSentiment}&`;
      if (filterSource) query += `source=${filterSource}&`;
      
      const data = await api.get(`/api/admin/reviews${query}`);
      setReviews(data as CustomerReview[]);
    } catch (err: any) {
      toast.error('Lỗi khi tải danh sách đánh giá: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/api/admin/reviews/${id}/approve`);
      toast.success('Đã duyệt phản hồi thành công.');
      loadReviews();
    } catch (err: any) {
      toast.error('Lỗi khi duyệt phản hồi: ' + err.message);
    }
  };

  const handleCustomReplySubmit = async (id: number) => {
    if (!customReplyVi.trim() && !customReplyEn.trim()) {
      toast.error('Phản hồi không được để trống.');
      return;
    }
    try {
      await api.post(`/api/admin/reviews/${id}/reply`, {
        responseVi: customReplyVi,
        responseEn: customReplyEn
      });
      toast.success('Đã sửa đổi và duyệt gửi phản hồi.');
      setReplyingReviewId(null);
      loadReviews();
    } catch (err: any) {
      toast.error('Gửi phản hồi thất bại: ' + err.message);
    }
  };

  const handleStartCustomReply = (rev: CustomerReview) => {
    setReplyingReviewId(rev.id);
    setCustomReplyVi(rev.responseVi || '');
    setCustomReplyEn(rev.responseEn || '');
    setActiveLangTab('vi');
  };

  const handleMockIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockName.trim() || !mockComment.trim()) {
      toast.error('Tên và ý kiến khách hàng không được để trống.');
      return;
    }
    setIngesting(true);
    try {
      await api.post('/api/admin/reviews/mock-external', {
        customerName: mockName.trim(),
        customerPhone: mockPhone.trim() || null,
        rating: mockRating,
        comment: mockComment.trim(),
        branchId: mockBranch.trim(),
        source: mockSource
      });
      toast.success('Đã đồng bộ đánh giá giả lập về hệ thống thành công.');
      setShowIngest(false);
      
      // Reset form
      setMockName('');
      setMockPhone('');
      setMockComment('');
      loadReviews();
    } catch (err: any) {
      toast.error('Gửi đánh giá giả lập thất bại: ' + err.message);
    } finally {
      setIngesting(false);
    }
  };

  // Stats calculation
  const totalCount = reviews.length;
  const avgRating = totalCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1) : '0.0';
  const posCount = reviews.filter(r => r.sentiment === 'POSITIVE').length;
  const negCount = reviews.filter(r => r.sentiment === 'NEGATIVE').length;
  const neuCount = reviews.filter(r => r.sentiment === 'NEUTRAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-indigo-650" />
            Omnichannel Review Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gom đánh giá từ mạng xã hội (Google Maps, Facebook, Tripadvisor) và hệ thống nhà hàng. Phân tích cảm xúc tự động bằng AI.
          </p>
        </div>
        <button
          onClick={() => setShowIngest(!showIngest)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 font-bold text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Giả lập Đánh giá ngoài
        </button>
      </div>

      {/* Mock Ingest Form */}
      {showIngest && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-emerald-800 text-sm uppercase flex items-center gap-2">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Đồng bộ hóa đánh giá ngoài (Giả lập webhook từ Google/Facebook)
          </h3>
          <form onSubmit={handleMockIngest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tên khách hàng *</label>
              <input
                type="text"
                value={mockName}
                onChange={(e) => setMockName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Số điện thoại</label>
              <input
                type="text"
                value={mockPhone}
                onChange={(e) => setMockPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nguồn đánh giá</label>
              <select
                value={mockSource}
                onChange={(e) => setMockSource(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
              >
                <option value="GOOGLE_MAPS">Google Maps</option>
                <option value="FACEBOOK">Facebook Page</option>
                <option value="TRIPADVISOR">Tripadvisor</option>
                <option value="SYSTEM">Hệ thống nội bộ</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Đánh giá sao *</label>
              <select
                value={mockRating}
                onChange={(e) => setMockRating(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold"
              >
                <option value="5">★★★★★ (5 Sao)</option>
                <option value="4">★★★★☆ (4 Sao)</option>
                <option value="3">★★★☆☆ (3 Sao)</option>
                <option value="2">★★☆☆☆ (2 Sao)</option>
                <option value="1">★☆☆☆☆ (1 Sao)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Chi nhánh áp dụng</label>
              <input
                type="text"
                value={mockBranch}
                onChange={(e) => setMockBranch(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
              />
            </div>
            <div className="sm:col-span-2 md:col-span-3 space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Bình luận của khách hàng *</label>
              <textarea
                value={mockComment}
                onChange={(e) => setMockComment(e.target.value)}
                placeholder="Nhập nội dung phản hồi của khách..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs"
                required
              />
            </div>
            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowIngest(false)}
                className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={ingesting}
                className="px-5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {ingesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Gửi và Phân tích AI
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase">Tổng đánh giá</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800">{totalCount}</span>
            <span className="text-slate-500 text-xs">phản hồi</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase">Điểm đánh giá TB</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800">{avgRating}</span>
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(avgRating)) ? 'fill-current' : ''}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase">Phân tích cảm xúc</span>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-emerald-600" title="Tích cực">
              <ThumbsUp className="w-4 h-4 fill-emerald-50" />
              <span className="font-extrabold">{posCount}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-600" title="Tiêu cực">
              <ThumbsDown className="w-4 h-4 fill-rose-50" />
              <span className="font-extrabold">{negCount}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400" title="Trung lập">
              <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
              <span className="font-extrabold">{neuCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-bold uppercase">Tỷ lệ duyệt trả lời</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-800">
              {totalCount > 0 ? ((reviews.filter(r => r.isApproved).length * 100) / totalCount).toFixed(0) : '0'}%
            </span>
            <span className="text-slate-400 text-xs">đã phản hồi</span>
          </div>
        </div>
      </div>

      {/* Filter and Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Filters bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold mr-2">
            <Filter className="w-4 h-4" />
            Bộ lọc đánh giá:
          </div>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="">Tất cả mức sao</option>
            <option value="5">5 Sao</option>
            <option value="4">4 Sao</option>
            <option value="3">3 Sao</option>
            <option value="2">2 Sao</option>
            <option value="1">1 Sao</option>
          </select>

          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="">Tất cả cảm xúc (AI)</option>
            <option value="POSITIVE">Tích cực (Positive)</option>
            <option value="NEGATIVE">Tiêu cực (Negative)</option>
            <option value="NEUTRAL">Trung lập (Neutral)</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="">Tất cả nguồn kênh</option>
            <option value="GOOGLE_MAPS">Google Maps</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="TRIPADVISOR">TripAdvisor</option>
            <option value="SYSTEM">Hệ thống nội bộ</option>
          </select>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin" />
            <span className="text-slate-500 text-sm mt-3">Đang cập nhật đánh giá cảm xúc...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-lg">Không tìm thấy đánh giá nào</h3>
            <p className="text-slate-400 text-sm mt-1">Thay đổi bộ lọc hoặc giả lập thêm đánh giá mới.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-slate-50/40 transition-colors">
                
                {/* Customer and metadata info */}
                <div className="w-full md:w-1/4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                      rev.source === 'GOOGLE_MAPS' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      rev.source === 'FACEBOOK' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      rev.source === 'TRIPADVISOR' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {rev.source === 'GOOGLE_MAPS' ? 'Google' :
                       rev.source === 'FACEBOOK' ? 'Facebook' :
                       rev.source === 'TRIPADVISOR' ? 'TripAdvisor' : 'Local'}
                    </span>

                    {/* Sentiment Analysis badge */}
                    {rev.sentiment && (
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                        rev.sentiment === 'POSITIVE' ? 'bg-emerald-100 text-emerald-700' :
                        rev.sentiment === 'NEGATIVE' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {rev.sentiment}
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-slate-800 truncate" title={rev.customerName}>
                      {rev.customerName}
                    </h4>
                    {rev.customerPhone && (
                      <p className="text-slate-400 text-[10px]">SĐT: {rev.customerPhone}</p>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      {new Date(rev.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Review comment and AI response box */}
                <div className="flex-1 space-y-4">
                  {/* Rating Stars and Comment */}
                  <div className="space-y-1">
                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {rev.comment || <em className="text-slate-400 font-normal">Không ghi bình luận</em>}
                    </p>
                  </div>

                  {/* AI Resolution Recommendations */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
                      <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-indigo-650 animate-pulse" />
                        AI gợi ý trả lời
                      </div>

                      {rev.isApproved ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã duyệt gửi
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                          Chờ duyệt phản hồi
                        </span>
                      )}
                    </div>

                    {replyingReviewId === rev.id ? (
                      /* Inline Custom Response Editor */
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveLangTab('vi')}
                            className={`px-3 py-1 rounded text-xs font-bold ${activeLangTab === 'vi' ? 'bg-indigo-600 text-white' : 'bg-slate-250 text-slate-500 hover:bg-slate-200'}`}
                          >
                            Tiếng Việt (VI)
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveLangTab('en')}
                            className={`px-3 py-1 rounded text-xs font-bold ${activeLangTab === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-250 text-slate-500 hover:bg-slate-200'}`}
                          >
                            Tiếng Anh (EN)
                          </button>
                        </div>

                        {activeLangTab === 'vi' ? (
                          <textarea
                            value={customReplyVi}
                            onChange={(e) => setCustomReplyVi(e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                            placeholder="Nhập câu trả lời Tiếng Việt..."
                          />
                        ) : (
                          <textarea
                            value={customReplyEn}
                            onChange={(e) => setCustomReplyEn(e.target.value)}
                            rows={3}
                            className="w-full p-3 border border-slate-200 bg-white rounded-xl text-xs focus:outline-none"
                            placeholder="Nhập câu trả lời Tiếng Anh..."
                          />
                        )}

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setReplyingReviewId(null)}
                            className="px-3 py-1 border border-slate-200 text-slate-500 rounded text-xs font-bold cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomReplySubmit(rev.id)}
                            className="px-4 py-1 bg-indigo-600 text-white rounded text-xs font-bold shadow hover:bg-indigo-700 cursor-pointer"
                          >
                            Duyệt & Gửi
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Suggestion Responses */
                      <div className="space-y-2">
                        <div className="text-xs text-slate-700">
                          <span className="font-bold text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Tiếng Việt (VI):</span>
                          <p className="italic bg-white p-2.5 rounded-xl border border-slate-100">{rev.responseVi || 'Chưa tạo gợi ý.'}</p>
                        </div>
                        <div className="text-xs text-slate-700">
                          <span className="font-bold text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Tiếng Anh (EN):</span>
                          <p className="italic bg-white p-2.5 rounded-xl border border-slate-100">{rev.responseEn || 'Chưa tạo gợi ý.'}</p>
                        </div>

                        {!rev.isApproved && (
                          <div className="flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => handleStartCustomReply(rev)}
                              className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
                            >
                              Sửa câu trả lời
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(rev.id)}
                              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Duyệt câu trả lời này
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
