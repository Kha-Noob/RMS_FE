'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Sparkles, Save, Eye, Palette, CheckSquare, Square, 
  RefreshCw, Globe, FileText, Calendar, MessageSquare, AlertCircle
} from 'lucide-react';

interface CustomPageConfig {
  id?: number;
  tenantId?: string;
  restaurantName: string;
  description: string;
  stylePrompt: string;
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

const DEFAULT_CONFIG: CustomPageConfig = {
  restaurantName: '',
  description: '',
  stylePrompt: '',
  primaryColor: '#25439b',
  secondaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  fontFamily: 'Inter',
  layoutStyle: 'modern',
  coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  showPosts: true,
  showEvents: true,
  showReviews: true,
  published: false
};

const FONT_OPTIONS = ['Inter', 'Playfair Display', 'Roboto', 'Courier Prime', 'Great Vibes', 'Montserrat', 'Lora', 'Pacifico'];
const LAYOUT_OPTIONS = [
  { value: 'modern', label: 'Hiện đại (Modern)' },
  { value: 'classic', label: 'Cổ điển (Classic)' },
  { value: 'minimal', label: 'Tối giản (Minimalist)' },
  { value: 'warm', label: 'Ấm cúng (Warm)' }
];

export default function AdminPageBuilder() {
  const { user } = useAuth();
  const [config, setConfig] = useState<CustomPageConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [welcomeTitle, setWelcomeTitle] = useState('Chào mừng đến với nhà hàng chúng tôi');
  
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Thiết kế AI của bạn. Hãy gửi ý tưởng phong cách thiết kế bạn mong muốn (ví dụ: "Nhà hàng sushi tối giản kiểu Nhật") hoặc yêu cầu tôi tinh chỉnh giao diện hiện tại nhé!'
    }
  ]);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/custom-pages/my-page');
      if (data && (data as any).id) {
        setConfig(data as CustomPageConfig);
      } else {
        // Fallback or setup initial name
        setConfig({
          ...DEFAULT_CONFIG,
          restaurantName: 'Nhà hàng của bạn'
        });
      }
    } catch (err: any) {
      toast.error('Không thể tải cấu hình giao diện: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    const currentPrompt = aiPrompt.trim();
    if (!currentPrompt) {
      toast.error('Vui lòng nhập ý tưởng thiết kế giao diện.');
      return;
    }
    
    // Add user message to chat log
    setMessages(prev => [...prev, { sender: 'user', text: currentPrompt }]);
    setAiPrompt('');
    setAiGenerating(true);

    try {
      // Construct currentSettings payload to pass contextual layout configuration to Gemini
      const currentSettings = {
        restaurantName: config.restaurantName,
        description: config.description,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        fontFamily: config.fontFamily,
        layoutStyle: config.layoutStyle,
        coverImageUrl: config.coverImageUrl
      };

      const res = await api.post<any>('/api/admin/custom-pages/generate', { 
        prompt: currentPrompt,
        currentSettings: currentSettings
      });
      
      let coverImg = config.coverImageUrl;
      if (res.coverImageCuisineKeyword && res.coverImageCuisineKeyword.trim().length > 0) {
        // Find unsplash image based on keyword
        coverImg = `https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80`;
        // Check for specific keywords to assign nicer defaults
        const kw = res.coverImageCuisineKeyword.toLowerCase();
        if (kw.includes('coffee') || kw.includes('cafe')) {
          coverImg = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80';
        } else if (kw.includes('sushi') || kw.includes('japanese')) {
          coverImg = 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80';
        } else if (kw.includes('italian') || kw.includes('pizza') || kw.includes('pasta')) {
          coverImg = 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?auto=format&fit=crop&w=1200&q=80';
        } else if (kw.includes('french') || kw.includes('fine dining')) {
          coverImg = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80';
        }
      }

      setConfig(prev => ({
        ...prev,
        stylePrompt: currentPrompt,
        primaryColor: res.primaryColor || prev.primaryColor,
        secondaryColor: res.secondaryColor || prev.secondaryColor,
        backgroundColor: res.backgroundColor || prev.backgroundColor,
        textColor: res.textColor || prev.textColor,
        fontFamily: res.fontFamily || prev.fontFamily,
        layoutStyle: res.layoutStyle || prev.layoutStyle,
        description: res.welcomeDescription || prev.description,
        coverImageUrl: coverImg
      }));

      if (res.welcomeTitle) {
        setWelcomeTitle(res.welcomeTitle);
      }

      // Add AI response message to chat log
      const summaryText = `Tôi đã đề xuất giao diện phong cách "${res.themeName || 'Cập nhật'}":\n- Tông màu: ${res.primaryColor} (Chủ đạo), ${res.secondaryColor} (Phụ).\n- Mô tả: ${res.welcomeDescription || 'Đã cập nhật theo phong cách.'}`;
      setMessages(prev => [...prev, { sender: 'ai', text: summaryText }]);
      toast.success(`AI đã đề xuất giao diện: "${res.themeName || 'Thành công'}"`);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Rất tiếc, tôi đã gặp lỗi khi thiết kế: ${err.message}` }]);
      toast.error('AI thiết kế thất bại: ' + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...config,
        description: config.description || welcomeTitle // fallback
      };
      await api.post('/api/admin/custom-pages/save', payload);
      toast.success('Lưu cấu hình giao diện thành công.');
      loadConfig();
    } catch (err: any) {
      toast.error('Không thể lưu cấu hình: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof CustomPageConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Google Font Link generator
  const getGoogleFontLink = (font: string) => {
    if (!font || font === 'Inter' || font === 'Roboto') return '';
    return `https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;700;800&display=swap`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-slate-500 text-sm mt-3">Đang tải thiết lập trang...</span>
      </div>
    );
  }

  const fontStylesheet = getGoogleFontLink(config.fontFamily);

  return (
    <div className="space-y-6">
      {fontStylesheet && (
        <link rel="stylesheet" href={fontStylesheet} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Palette className="w-7 h-7 text-indigo-600" />
            Thiết kế Trang Nhà Hàng bằng AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sử dụng trí tuệ nhân tạo để thiết kế nhanh chóng giao diện quảng bá nhà hàng theo đúng phong cách của bạn.
          </p>
        </div>
        <div>
          {config.published && config.tenantId && (
            <a
              href={`/restaurant-page/${config.tenantId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors border border-slate-200"
            >
              <Eye className="w-4 h-4" />
              Xem trang thực tế
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Design Form Controls */}
        <div className="xl:col-span-5 space-y-6">
          {/* AI Generator Chat Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
            <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
              Trợ lý Thiết kế AI (Interactive Chat)
            </h2>
            
            {/* Chat Messages Log */}
            <div className="h-[250px] overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100/80 scrollbar-thin">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-br-none' 
                        : 'bg-white text-slate-700 border border-slate-200/80 rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex items-center gap-1 mb-1 font-bold text-violet-600 uppercase text-[9px] tracking-wider">
                        <Sparkles className="w-3 h-3 text-violet-500" />
                        AI Designer
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !aiGenerating) {
                    handleAiGenerate();
                  }
                }}
                disabled={aiGenerating}
                placeholder={aiGenerating ? "AI đang thiết kế..." : "Yêu cầu AI đổi màu, mô tả hoặc font chữ..."}
                className="w-full pl-4 pr-12 py-3 text-xs border border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none disabled:bg-slate-50 leading-relaxed shadow-inner"
              />
              <button
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="absolute right-1.5 p-2 bg-gradient-to-r from-violet-600 to-indigo-600 disabled:from-slate-200 disabled:to-slate-300 text-white rounded-lg shadow transition-all hover:scale-105 cursor-pointer flex items-center justify-center"
                title="Gửi yêu cầu thiết kế"
              >
                {aiGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Form Settings */}
          <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="font-extrabold text-slate-800 text-base pb-3 border-b border-slate-100">
              Tinh chỉnh thiết kế thủ công
            </h2>

            {/* Restaurant Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Tên nhà hàng hiển thị</label>
                <input
                  type="text"
                  value={config.restaurantName}
                  onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Lời giới thiệu/Mô tả</label>
                <textarea
                  value={config.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Link hình nền/Banner</label>
                <input
                  type="text"
                  value={config.coverImageUrl}
                  onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Styling */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Cấu hình Style & Màu sắc</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Màu chủ đạo</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Màu phụ</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={config.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Màu nền</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Màu chữ chính</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={config.textColor}
                      onChange={(e) => handleInputChange('textColor', e.target.value)}
                      className="w-full px-2 py-1 border border-slate-200 rounded text-xs uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Font Chữ (Google Fonts)</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Phong cách bố cục</label>
                  <select
                    value={config.layoutStyle}
                    onChange={(e) => handleInputChange('layoutStyle', e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs"
                  >
                    {LAYOUT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modules Checkboxes */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Cấu hình Module hiển thị</h3>
              
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleInputChange('showPosts', !config.showPosts)}
                  className="flex items-center gap-2.5 text-slate-700 text-sm font-medium hover:text-slate-900 cursor-pointer"
                >
                  {config.showPosts ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                  <span>Hiển thị CMS Bài viết & Tin tức</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('showEvents', !config.showEvents)}
                  className="flex items-center gap-2.5 text-slate-700 text-sm font-medium hover:text-slate-900 cursor-pointer"
                >
                  {config.showEvents ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                  <span>Hiển thị CMS Sự kiện của chuỗi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('showReviews', !config.showReviews)}
                  className="flex items-center gap-2.5 text-slate-700 text-sm font-medium hover:text-slate-900 cursor-pointer"
                >
                  {config.showReviews ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300" />
                  )}
                  <span>Hiển thị Hub Đánh giá & Reviews</span>
                </button>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
              <button
                type="button"
                onClick={() => handleInputChange('published', !config.published)}
                className="flex items-center gap-2.5 text-slate-800 text-sm font-extrabold cursor-pointer"
              >
                {config.published ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300" />
                )}
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  Xuất bản công khai lên Explore
                </span>
              </button>
              <p className="text-[10px] text-slate-400 pl-7 leading-relaxed">
                Khi chọn xuất bản, trang nhà hàng này sẽ được hiển thị công khai ở phần Explore của trang chủ hệ thống cho thực khách khám phá.
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang lưu thiết lập...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lưu & Áp dụng thiết kế
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Live Dynamic UI Preview */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              Live Preview (Xem trước giao diện)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold">
              Layout: {config.layoutStyle.toUpperCase()}
            </span>
          </div>

          {/* Device Mockup */}
          <div className="border border-slate-200 rounded-3xl bg-slate-100 p-3 shadow-inner max-h-[85vh] overflow-auto">
            <div 
              style={{
                backgroundColor: config.backgroundColor,
                color: config.textColor,
                fontFamily: config.fontFamily !== 'Inter' && config.fontFamily !== 'Roboto' ? `"${config.fontFamily}", sans-serif` : 'inherit'
              }}
              className="rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-[600px] flex flex-col transition-all duration-300"
            >
              {/* Restaurant Header Banner */}
              <div 
                className="h-44 bg-cover bg-center relative flex items-end p-5"
                style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0.2)), url(${config.coverImageUrl})` }}
              >
                <div className="space-y-1 text-white">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-sm">
                    {config.restaurantName || 'Tên nhà hàng của bạn'}
                  </h1>
                  <p className="text-xs text-white/80 line-clamp-2 max-w-lg drop-shadow-sm font-medium">
                    {config.description || 'Mô tả ngắn về nhà hàng của bạn sẽ được hiển thị ở đây.'}
                  </p>
                </div>
              </div>

              {/* Dynamic Styled Page Navigation Bar */}
              <div 
                className="px-5 py-3 border-b border-black/5 flex gap-4 text-xs font-bold"
                style={{ borderBottomColor: `${config.primaryColor}1a` }}
              >
                <span style={{ color: config.primaryColor }} className="border-b-2 pb-1 border-current">Trang chủ</span>
                <span className="opacity-60">Thực đơn</span>
                <span className="opacity-60">Ưu đãi</span>
                <span className="opacity-60">Liên hệ</span>
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 space-y-6">
                
                {/* 1. Article Feature */}
                {config.showPosts && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-black/5 pb-1">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                        Bài viết & Tin tức mới nhất
                      </h3>
                      <span className="text-[10px] font-bold" style={{ color: config.secondaryColor }}>Xem thêm</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-black/5 bg-black/[0.01] space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold line-clamp-1">Giới thiệu thực đơn mới hè 2026</h4>
                          <p className="text-[10px] opacity-60 line-clamp-2">Khám phá bộ sưu tập ẩm thực biển mát lạnh đậm chất nhiệt đới với các món ăn độc đáo vừa được ra mắt.</p>
                        </div>
                        <span className="text-[9px] font-semibold mt-1 self-start px-2 py-0.5 rounded-full" style={{ backgroundColor: `${config.primaryColor}1a`, color: config.primaryColor }}>Đã đăng</span>
                      </div>
                      <div className="p-3.5 rounded-xl border border-black/5 bg-black/[0.01] space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold line-clamp-1">Khai trương chi nhánh thứ 3 tại trung tâm</h4>
                          <p className="text-[10px] opacity-60 line-clamp-2">Tưng bừng khai trương chi nhánh mới với ưu đãi giảm giá lên đến 20% cho toàn bộ thực đơn trong tuần đầu tiên.</p>
                        </div>
                        <span className="text-[9px] font-semibold mt-1 self-start px-2 py-0.5 rounded-full" style={{ backgroundColor: `${config.primaryColor}1a`, color: config.primaryColor }}>Đã đăng</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Events Feature */}
                {config.showEvents && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-black/5 pb-1">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                        Sự kiện & Khuyến mãi sắp diễn ra
                      </h3>
                      <span className="text-[10px] font-bold" style={{ color: config.secondaryColor }}>Xem tất cả</span>
                    </div>

                    <div className="p-4 rounded-xl flex items-center gap-4 text-white shadow-sm" style={{ backgroundColor: config.primaryColor }}>
                      <div className="text-center bg-white/20 p-2.5 rounded-lg shrink-0">
                        <p className="text-lg font-black leading-none">05</p>
                        <p className="text-[9px] font-bold uppercase mt-1">Th07</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold leading-tight">Đêm Hội Nhạc Trầm & Buffet Hải Sản Hạng Sang</h4>
                        <p className="text-[10px] text-white/80 line-clamp-1">Thời gian: 19:00 - Địa điểm: Chi nhánh 2Thang9</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Review Feature */}
                {config.showReviews && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-black/5 pb-1">
                      <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" style={{ color: config.primaryColor }} />
                        Đánh giá từ khách hàng
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl border border-black/5 bg-black/[0.01] space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold">Minh Anh</span>
                          <span className="text-[9px] text-amber-500 font-bold">★★★★★ 5.0</span>
                        </div>
                        <p className="text-[10px] opacity-75 italic leading-relaxed">"Đồ ăn ngon tuyệt vời, đặc biệt là món bò bít tết rất mềm. Không gian thiết kế cực kỳ ấm cúng và sang trọng!"</p>
                      </div>
                      <div className="p-3 rounded-xl border border-black/5 bg-black/[0.01] space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold">Hoàng Nam</span>
                          <span className="text-[9px] text-amber-500 font-bold">★★★★☆ 4.0</span>
                        </div>
                        <p className="text-[10px] opacity-75 italic leading-relaxed">"Phục vụ nhiệt tình chu đáo, đồ uống sáng tạo. Sẽ quay lại cùng gia đình."</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default Notice when no features selected */}
                {!config.showPosts && !config.showEvents && !config.showReviews && (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Không có tính năng nào được hiển thị</p>
                    <p className="text-[10px] text-slate-400 mt-1">Vui lòng bật hiển thị ít nhất một phân hệ bài viết, sự kiện hoặc đánh giá ở phần cài đặt bên trái.</p>
                  </div>
                )}

              </div>

              {/* Dynamic Styled Footer */}
              <div 
                className="p-5 text-center text-[10px] opacity-50 border-t border-black/5"
                style={{ backgroundColor: `${config.primaryColor}06` }}
              >
                © 2026 {config.restaurantName || 'Nhà hàng của bạn'}. Hỗ trợ bởi RMS Platform.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
