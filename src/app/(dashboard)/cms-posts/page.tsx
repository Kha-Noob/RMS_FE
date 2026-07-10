'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Plus, Edit, Trash2, Calendar, FileText, Send, Sparkles, Clock, Globe, Lock, ShieldAlert, CheckCircle, RefreshCw
} from 'lucide-react';

interface Article {
  id?: number;
  title: string;
  content: string;
  mediaUrls?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  isGlobal: boolean;
  isLocked: boolean;
  branchId?: string | null;
  publishAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export default function CmsPostsPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState('');
  const [status, setStatus] = useState<Article['status']>('DRAFT');
  const [isGlobal, setIsGlobal] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [publishAt, setPublishAt] = useState('');

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  const isAdmin = user?.roles.includes('ADMIN');
  const isManager = user?.roles.includes('MANAGER');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/articles');
      setArticles(data as Article[]);
    } catch (err: any) {
      toast.error('Không thể tải danh sách bài viết: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMediaUrls('');
    setStatus('DRAFT');
    setIsGlobal(!isManager); // default global for admin, local for manager
    setIsLocked(false);
    setBranchId(user?.branchId || '');
    setPublishAt('');
    setEditingArticle(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setContent(art.content);
    setMediaUrls(art.mediaUrls || '');
    setStatus(art.status);
    setIsGlobal(art.isGlobal);
    setIsLocked(art.isLocked);
    setBranchId(art.branchId || '');
    setPublishAt(art.publishAt ? new Date(art.publishAt).toISOString().slice(0, 16) : '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Tiêu đề và nội dung không được để trống.');
      return;
    }

    const payload: Article = {
      title: title.trim(),
      content: content.trim(),
      mediaUrls: mediaUrls.trim() || undefined,
      status,
      isGlobal,
      isLocked,
      branchId: isGlobal ? null : branchId || null,
      publishAt: status === 'SCHEDULED' ? publishAt : null
    };

    try {
      if (editingArticle?.id) {
        await api.put(`/api/admin/articles/${editingArticle.id}`, payload);
        toast.success('Cập nhật bài viết thành công.');
      } else {
        await api.post('/api/admin/articles', payload);
        toast.success('Tạo bài viết thành công.');
      }
      setModalOpen(false);
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu bài viết.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await api.delete(`/api/admin/articles/${id}`);
      toast.success('Xóa bài viết thành công.');
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa bài viết.');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Vui lòng nhập ý tưởng/từ khóa viết bài.');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await api.post<{ title?: string; content?: string; hashtags?: string }>('/api/admin/ai/articles/generate', { prompt: aiPrompt });
      if (res.title) setTitle(res.title);
      if (res.content) {
        const fullContent = res.content + (res.hashtags ? '\n\n' + res.hashtags : '');
        setContent(fullContent);
      }
      toast.success('Đã tạo bài viết bằng AI thành công.');
      setAiDrawerOpen(false);
    } catch (err: any) {
      toast.error('AI viết bài thất bại: ' + err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            CMS Quản Lý Bài Viết & Tin Tức
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Soạn thảo, quản lý bài viết giới thiệu, thực đơn hoặc sự kiện toàn chuỗi và từng chi nhánh.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 font-bold text-sm shadow-md shadow-indigo-100 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            Trợ lý viết bài AI
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-md shadow-blue-100 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Viết bài mới
          </button>
        </div>
      </div>

      {/* Main Grid Articles */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-slate-500 text-sm mt-3">Đang tải danh sách bài viết...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">Chưa có bài viết nào</h3>
          <p className="text-slate-400 text-sm mt-1">Hãy bắt đầu viết bài hoặc sử dụng AI Assistant để lên ý tưởng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div key={art.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {art.isGlobal ? (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
                        <Globe className="w-3 h-3" />
                        Toàn chuỗi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 font-bold border border-slate-100">
                        Chi nhánh: {art.branchId}
                      </span>
                    )}
                    {art.isLocked && (
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-100">
                        <Lock className="w-3 h-3" />
                        Khóa áp dụng
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    art.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    art.status === 'SCHEDULED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {art.status === 'PUBLISHED' ? 'Đã đăng' :
                     art.status === 'SCHEDULED' ? 'Lên lịch' : 'Bản nháp'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-lg leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Tạo bởi: {art.createdBy} ({art.createdAt ? new Date(art.createdAt).toLocaleDateString('vi-VN') : ''})
                  </p>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 whitespace-pre-wrap">
                  {art.content}
                </p>

                {art.status === 'SCHEDULED' && art.publishAt && (
                  <div className="flex items-center gap-2 p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-indigo-600 text-xs">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Lên lịch phát hành: <strong>{new Date(art.publishAt).toLocaleString('vi-VN')}</strong></span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-4">
                <span className="text-[10px] text-slate-400 truncate">ID: #{art.id}</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(art)}
                    disabled={art.isLocked && !isAdmin}
                    className="p-1.5 text-slate-500 hover:text-blue-600 bg-white rounded-lg border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => art.id && handleDelete(art.id)}
                    disabled={art.isLocked && !isAdmin}
                    className="p-1.5 text-slate-500 hover:text-rose-600 bg-white rounded-lg border border-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                {editingArticle ? 'Cập nhật bài viết' : 'Soạn bài viết mới'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-4">
              {/* Permissions Warnings */}
              {editingArticle?.isLocked && !isAdmin && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-xs flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Bài viết bị khóa toàn chuỗi. Bạn không thể chỉnh sửa trừ khi có quyền Admin.</span>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Tiêu đề bài viết</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none text-sm font-medium"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Nội dung</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Viết nội dung bài viết..."
                  rows={8}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none text-sm leading-relaxed"
                  required
                />
              </div>

              {/* Media URLs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Link hình ảnh / video (Phân tách bởi dấu chấm phẩy ;)</label>
                <input
                  type="text"
                  value={mediaUrls}
                  onChange={(e) => setMediaUrls(e.target.value)}
                  placeholder="https://example.com/image1.jpg;https://example.com/image2.jpg"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none text-sm"
                />
              </div>

              {/* Scope Settings */}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isGlobal"
                      checked={isGlobal}
                      onChange={(e) => {
                        setIsGlobal(e.target.checked);
                        if (e.target.checked) setBranchId('');
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="isGlobal" className="text-xs font-bold text-slate-700 block">Áp dụng Toàn chuỗi</label>
                      <span className="text-[10px] text-slate-400 block">Hiển thị cho tất cả chi nhánh</span>
                    </div>
                  </div>

                  {isGlobal && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isLocked"
                        checked={isLocked}
                        onChange={(e) => setIsLocked(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <label htmlFor="isLocked" className="text-xs font-bold text-slate-700 block">Khóa bài viết</label>
                        <span className="text-[10px] text-slate-400 block">Không cho phép Store Manager sửa</span>
                      </div>
                    </div>
                  )}

                  {!isGlobal && (
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">Chọn chi nhánh áp dụng</label>
                      <input
                        type="text"
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        placeholder="Nhập mã chi nhánh (Ví dụ: 01-2thang9)..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Status and Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Trạng thái phát hành</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Article['status'])}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none text-sm"
                  >
                    <option value="DRAFT">Lưu bản nháp</option>
                    <option value="PUBLISHED">Đăng ngay lập tức</option>
                    <option value="SCHEDULED">Lên lịch phát hành</option>
                  </select>
                </div>

                {status === 'SCHEDULED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">Thời gian lên lịch</label>
                    <input
                      type="datetime-local"
                      value={publishAt}
                      onChange={(e) => setPublishAt(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-blue-600 focus:outline-none text-sm"
                      required
                    />
                  </div>
                )}
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
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {editingArticle ? 'Cập nhật' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant Drawer */}
      {aiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 animate-slide-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Trợ lý viết bài AI
              </h2>
              <button onClick={() => setAiDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Ý tưởng hoặc Từ khóa chính</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ví dụ: Viết một bài giới thiệu món mới Gỏi cá trích cho dịp hè nắng nóng, nhấn mạnh vị tươi mát của cá biển Phú Quốc và nước xốt chua ngọt đặc biệt..."
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none text-sm"
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                * Trợ lý AI (Gemini 1.5 Flash) sẽ phân tích từ khóa của bạn để tạo ra bài viết gồm Tiêu đề cuốn hút, nội dung bài viết hoàn chỉnh và đề xuất các hashtags thích hợp cho nhà hàng.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAiDrawerOpen(false)}
                className="w-1/3 py-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={generatingAi}
                className="w-2/3 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm rounded-lg shadow-md disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                {generatingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang viết bài...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Sinh bài viết ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
