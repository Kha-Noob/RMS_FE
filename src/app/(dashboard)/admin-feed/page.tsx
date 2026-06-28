'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Shield,
  Trash2,
  Check,
  AlertTriangle,
  EyeOff,
  Eye,
  Plus,
  X,
  FileText,
  Star,
  Flag,
  User as UserIcon,
  Search
} from 'lucide-react';

export default function AdminFeedModerationPage() {
  const { locale } = useLanguage();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [blacklistKeywords, setBlacklistKeywords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const postsRes = await api.get<any[]>('/api/admin/feed/posts');
      setPosts(postsRes || []);
      const blacklistRes = await api.get<any[]>('/api/admin/feed/blacklist');
      setBlacklistKeywords(blacklistRes || []);
    } catch (err) {
      toast.error(locale === 'vi' ? 'Không thể tải danh sách bài viết.' : 'Failed to load posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (postId: number, status: string) => {
    try {
      await api.put(`/api/admin/feed/posts/${postId}/status`, null, {
        params: { status }
      });
      toast.success(locale === 'vi' ? 'Cập nhật trạng thái thành công!' : 'Status updated successfully!');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm(locale === 'vi' ? 'Bạn có chắc chắn muốn xoá bài viết này không?' : 'Are you sure you want to delete this post?')) {
      return;
    }
    try {
      await api.delete(`/api/admin/feed/posts/${postId}`);
      toast.success(locale === 'vi' ? 'Xoá bài viết thành công!' : 'Post deleted successfully!');
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xoá thất bại.');
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    try {
      await api.post('/api/admin/feed/blacklist', null, {
        params: { keyword: newKeyword.trim() }
      });
      toast.success(locale === 'vi' ? 'Đã thêm từ khóa vào danh sách đen.' : 'Keyword added to blacklist.');
      setNewKeyword('');
      const blacklistRes = await api.get<any[]>('/api/admin/feed/blacklist');
      setBlacklistKeywords(blacklistRes || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thêm từ khóa.');
    }
  };

  const handleDeleteKeyword = async (id: number) => {
    try {
      await api.delete(`/api/admin/feed/blacklist/${id}`);
      toast.success(locale === 'vi' ? 'Xoá từ khóa thành công!' : 'Keyword deleted successfully!');
      const blacklistRes = await api.get<any[]>('/api/admin/feed/blacklist');
      setBlacklistKeywords(blacklistRes || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xoá từ khóa.');
    }
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.authorName.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            {locale === 'vi' ? 'Quản lý Đánh giá & Phản hồi' : 'Review & Feed Moderation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {locale === 'vi' 
              ? 'Kiểm duyệt nội dung bài đăng của khách hàng, lọc bài viết chứa từ khóa nhạy cảm hoặc nhận nhiều báo cáo.' 
              : 'Moderate customer posts, filter spam keywords, and handle reported feedback.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Middle section: Flagged & Reported Posts list */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-800 text-sm">{locale === 'vi' ? 'Danh sách bài đăng' : 'Posts Feed List'}</h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={locale === 'vi' ? 'Tìm tác giả, nội dung...' : 'Search author, text...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-xs text-slate-400">{locale === 'vi' ? 'Đang tải dữ liệu...' : 'Loading...'}</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              {locale === 'vi' ? 'Không có bài đăng nào cần duyệt.' : 'No posts found.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const hasWarning = post.reportCount >= 3 || post.status === 'PENDING_MODERATION';

                return (
                  <div 
                    key={post.id} 
                    className={`p-4 rounded-xl border transition-all ${hasWarning ? 'border-amber-200 bg-amber-50/10' : 'border-slate-150 bg-white hover:border-slate-200'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Author & Header info */}
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800">{post.authorName}</span>
                            <span className="text-[10px] text-slate-400">({post.authorPhone || 'N/A'})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            ID: #{post.id} • {new Date(post.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {post.status === 'PENDING_MODERATION' && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            {locale === 'vi' ? 'Chờ Duyệt' : 'Pending'}
                          </span>
                        )}
                        {post.status === 'PUBLIC' && (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            Public
                          </span>
                        )}
                        {post.status === 'HIDDEN' && (
                          <span className="text-[9px] font-bold bg-slate-100 text-slate-650 px-2 py-0.5 rounded-full">
                            Hidden
                          </span>
                        )}

                        {post.reportCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                            <Flag className="h-3 w-3" />
                            {post.reportCount} {locale === 'vi' ? 'Báo cáo' : 'Reports'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mt-3 pl-11 space-y-2">
                      <p className="text-xs text-slate-650 leading-relaxed break-all whitespace-pre-wrap">{post.content}</p>
                      
                      {/* Rating details */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className={`h-3.5 w-3.5 ${star <= post.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>

                      {/* Media Attached */}
                      {post.mediaUrls && (
                        <div className="flex gap-2 overflow-x-auto py-1">
                          {post.mediaUrls.split(';').filter(Boolean).map((url: string, index: number) => {
                            const cleanUrl = url.startsWith('http') 
                              ? url 
                              : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${url}`;
                            const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().contains('video');
                            return (
                              <div key={index} className="h-16 w-24 rounded border border-slate-100 overflow-hidden bg-slate-50 relative shrink-0">
                                {isVideo ? (
                                  <video src={cleanUrl} className="w-full h-full object-cover" muted />
                                ) : (
                                  <img src={cleanUrl} alt="review media" className="w-full h-full object-cover" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-[10px] font-bold">
                        {post.status !== 'PUBLIC' && (
                          <button
                            onClick={() => handleUpdateStatus(post.id, 'PUBLIC')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{locale === 'vi' ? 'Duyệt hiển thị' : 'Approve'}</span>
                          </button>
                        )}
                        {post.status !== 'HIDDEN' && (
                          <button
                            onClick={() => handleUpdateStatus(post.id, 'HIDDEN')}
                            className="bg-slate-100 hover:bg-slate-250 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>{locale === 'vi' ? 'Ẩn tạm thời' : 'Hide'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{locale === 'vi' ? 'Xoá vĩnh viễn' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Section: Blacklist Keywords Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {locale === 'vi' ? 'Bộ lọc từ khóa nhạy cảm' : 'Sensitive Keywords Blacklist'}
            </h3>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {locale === 'vi'
                ? 'Các bài đăng chứa từ khóa trong bộ lọc này sẽ tự động chuyển trạng thái "Chờ Duyệt" và không hiển thị công khai trên New Feed.'
                : 'Posts containing these keywords are held in moderation queue and hidden from the public feed automatically.'}
            </p>

            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                required
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder={locale === 'vi' ? 'VD: tồi tệ, dở quá...' : 'E.g. terrible, dirty...'}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white text-slate-700"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center shrink-0"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>
            </form>

            {blacklistKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {blacklistKeywords.map(k => (
                  <span key={k.id} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm animate-fade-in">
                    {k.keyword}
                    <button type="button" onClick={() => handleDeleteKeyword(k.id)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
