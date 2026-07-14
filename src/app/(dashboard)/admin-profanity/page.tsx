'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  ShieldAlert, UploadCloud, CheckCircle2, AlertTriangle, FileText, RefreshCw, Search, ListFilter, Trash2
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  message: string;
  count: number;
}

export default function AdminProfanityPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeWords, setActiveWords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActiveWords();
  }, []);

  const loadActiveWords = async () => {
    setRefreshing(true);
    try {
      const words = await api.get<string[]>('/api/admin/profanity/words');
      setActiveWords(words);
    } catch (err: any) {
      toast.error('Không thể tải danh sách từ cấm: ' + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.txt')) {
      toast.error('Chỉ hỗ trợ tải lên tệp định dạng văn bản (.txt)');
      return;
    }
    setFile(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Vui lòng chọn một tệp trước khi tải lên.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.uploadFile<ImportResult>('/api/admin/profanity/import', file);
      if (response.success) {
        toast.success(`Đã đồng bộ thành công! Hiện tại có ${response.count} từ cấm trong hệ thống.`);
        setFile(null);
        loadActiveWords();
      } else {
        toast.error('Không thể hoàn tất nạp từ cấm.');
      }
    } catch (err: any) {
      toast.error('Lỗi khi nạp dữ liệu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWords = activeWords.filter(word => 
    word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-600 to-red-700 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-rose-200 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold">Bộ lọc từ ngữ không phù hợp (Profanity Filter)</h2>
          </div>
          <p className="text-sm text-rose-100 max-w-2xl">
            Quản lý từ cấm toàn hệ thống. Mọi bình luận, đánh giá review, bài viết diễn đàn và tin nhắn gửi chatbot chứa các từ này sẽ bị chặn tức thời.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload & Guides */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-rose-600" /> Quy định tệp từ cấm
            </h3>
            
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Để cập nhật danh sách từ cấm, hãy chuẩn bị một tệp <strong>văn bản thuần (.txt)</strong>. Mỗi từ hoặc cụm từ cấm được ghi trên <strong>một dòng riêng biệt</strong>.
              </p>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px] space-y-1">
                <div className="text-slate-400 font-semibold mb-1">// Ví dụ file txt:</div>
                <div>từ_cấm_1</div>
                <div>từ_cấm_2</div>
                <div>từ_cấm_chửi_thề</div>
              </div>

              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 flex gap-2 text-rose-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Lưu ý:</strong> Việc nạp tệp từ cấm mới sẽ thay thế hoàn toàn danh sách từ cấm hiện tại của hệ thống.
                </div>
              </div>
            </div>
          </div>

          {/* Drag & Drop uploader */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]
                ${dragging 
                  ? 'border-rose-500 bg-rose-50/50 scale-98' 
                  : file 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-slate-300 hover:border-rose-500 hover:bg-slate-50/50'
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
              />

              {file ? (
                <>
                  <FileText className="h-12 w-12 text-emerald-500 mb-3" />
                  <div className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{file.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
                </>
              ) : (
                <>
                  <UploadCloud className="h-12 w-12 text-slate-400 mb-3 group-hover:text-rose-500" />
                  <div className="text-sm font-semibold text-slate-700">Kéo thả file .txt vào đây</div>
                  <div className="text-xs text-slate-400 mt-1">Hoặc nhấp chuột để chọn tệp</div>
                </>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-650 py-2.5 text-white hover:opacity-95 font-semibold text-sm shadow-md transition-all active:scale-95 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang tải lên dữ liệu từ cấm...
                </>
              ) : (
                'Đồng bộ từ cấm'
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Active Words display */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Từ ngữ cấm đang hoạt động</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hiện đang chặn tổng cộng {activeWords.length} từ.</p>
              </div>
              <button
                onClick={loadActiveWords}
                disabled={refreshing}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm từ cấm..."
                className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Words Pills Grid */}
            <div className="flex-1 mt-4 border border-slate-100 rounded-xl p-4 bg-slate-50 overflow-y-auto max-h-[350px]">
              {filteredWords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredWords.map((word, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-xs font-semibold shadow-sm animate-fade-in"
                    >
                      <ShieldAlert className="h-3 w-3 text-rose-500" />
                      {word}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 space-y-2">
                  <ListFilter className="h-10 w-10 text-slate-200 stroke-1" />
                  <div className="text-sm font-medium">Không tìm thấy từ ngữ nào</div>
                  <p className="text-xs text-center max-w-[200px]">Hãy thử tìm kiếm với từ khóa khác.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
