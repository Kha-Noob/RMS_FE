'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { 
  Sparkles, UploadCloud, CheckCircle2, AlertTriangle, FileText, RefreshCw, Search, Building2, BookOpen
} from 'lucide-react';

interface ImportResult {
  success: boolean;
  updatedCount: number;
  createdCount: number;
  details: string[];
}

export default function CmsChatbotPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!name.endsWith('.docx') && !name.endsWith('.txt')) {
      toast.error('Chỉ hỗ trợ tải lên tệp định dạng .docx hoặc .txt');
      return;
    }
    setFile(selectedFile);
    setResult(null); // Reset previous result
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
      const response = await api.uploadFile<ImportResult>('/api/admin/chatbot-import', file);
      if (response.success) {
        setResult(response);
        toast.success(`Nạp dữ liệu thành công! Tạo mới: ${response.createdCount}, Cập nhật: ${response.updatedCount}`);
      } else {
        toast.error('Không thể hoàn tất nạp dữ liệu.');
      }
    } catch (err: any) {
      toast.error('Lỗi khi nạp dữ liệu: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = result?.details.filter(log => 
    log.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-indigo-700 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold">Cấu hình tri thức Chatbot AI</h2>
          </div>
          <p className="text-sm text-violet-100 max-w-2xl">
            Tải lên tài liệu thực đơn, thành phần món ăn hoặc cẩm nang hoạt động để huấn luyện thông tin đặc thù của nhà hàng cho trợ lý ảo AI.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 self-start md:self-auto">
          <Building2 className="h-5 w-5 text-violet-200" />
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-wider text-violet-300 font-semibold">Nhà hàng/Tenant</div>
            <div className="text-sm font-semibold truncate max-w-[150px]">{user?.name || 'LiteFlow System'}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Upload & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-600" /> Hướng dẫn tài liệu
            </h3>
            
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                Để AI hiểu chính xác, hãy viết thông tin mỗi món ăn trên một dòng riêng biệt trong tệp <strong>Word (.docx)</strong> hoặc tệp <strong>Text (.txt)</strong>.
              </p>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-[10px] space-y-1">
                <div className="text-slate-400 font-semibold mb-1">// Mẫu định dạng:</div>
                <div>Cơm Tấm Sườn: Gạo tấm, sườn heo, mật ong, hành</div>
                <div>Bún Chả Hà Nội: Bún, thịt heo, đu đủ, nước mắm</div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  Hệ thống sẽ cập nhật thành phần nếu món ăn đã tồn tại, hoặc tạo mới món ăn với quyền quản lý của bạn.
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
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px]
                ${dragging 
                  ? 'border-violet-500 bg-violet-50/50 scale-98' 
                  : file 
                    ? 'border-emerald-500 bg-emerald-50/10' 
                    : 'border-slate-300 hover:border-violet-500 hover:bg-slate-50/50'
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".docx,.txt"
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
                  <UploadCloud className="h-12 w-12 text-slate-400 mb-3 group-hover:text-violet-500" />
                  <div className="text-sm font-semibold text-slate-700">Kéo thả tài liệu vào đây</div>
                  <div className="text-xs text-slate-400 mt-1">Hoặc nhấp chuột để chọn tệp từ thiết bị</div>
                  <div className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 mt-3 font-medium">Hỗ trợ .docx, .txt</div>
                </>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-white hover:opacity-95 font-semibold text-sm shadow-md transition-all active:scale-95 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Đang đồng bộ dữ liệu...
                </>
              ) : (
                'Tải lên và đồng bộ AI'
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Execution Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Nhật ký cập nhật tri thức</h3>
                <p className="text-xs text-slate-400 mt-0.5">Hiển thị kết quả phân tích cú pháp và cập nhật dữ liệu của tệp.</p>
              </div>
              
              {result && (
                <div className="flex gap-4">
                  <div className="text-center bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100">
                    <div className="text-xs text-violet-400 font-medium">Cập nhật</div>
                    <div className="text-lg font-bold text-violet-700">{result.updatedCount}</div>
                  </div>
                  <div className="text-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <div className="text-xs text-emerald-400 font-medium">Tạo mới</div>
                    <div className="text-lg font-bold text-emerald-700">{result.createdCount}</div>
                  </div>
                </div>
              )}
            </div>

            {result ? (
              <div className="flex-1 flex flex-col mt-4 space-y-4">
                {/* Search Log Bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm dòng nhật ký..."
                    className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-violet-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Log Screen */}
                <div className="flex-1 overflow-y-auto border border-slate-100 bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-[350px]">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((logStr, idx) => {
                      const isUpdate = logStr.startsWith('Cập nhật');
                      const isCreate = logStr.startsWith('Tạo mới');
                      return (
                        <div key={idx} className="py-1 border-b border-slate-800/60 last:border-0 flex gap-2">
                          <span className="text-slate-500 select-none">[{idx + 1}]</span>
                          <span className={
                            isUpdate 
                              ? 'text-violet-400' 
                              : isCreate 
                                ? 'text-emerald-400' 
                                : 'text-slate-400'
                          }>
                            {logStr}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-500 py-10">Không tìm thấy nhật ký trùng khớp</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <CheckCircle2 className="h-12 w-12 text-slate-200 stroke-1" />
                <div className="font-semibold text-sm">Chưa có dữ liệu huấn luyện</div>
                <div className="text-xs max-w-[280px] text-center leading-relaxed">
                  Hãy tải lên một tệp tài liệu ở cột bên trái để cập nhật thông tin cho AI.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
