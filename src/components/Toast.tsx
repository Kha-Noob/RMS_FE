'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  duration?: number;
}

let toastId = 0;
let listeners: ((toasts: ToastItem[]) => void)[] = [];
let toastItems: ToastItem[] = [];

function notify(message: string, type: ToastItem['type'] = 'info', title?: string, duration: number = 5000) {
  const id = ++toastId;
  const newToast: ToastItem = { id, message, type, title, duration };
  toastItems = [newToast, ...toastItems]; // Show newest on top
  listeners.forEach(fn => fn([...toastItems]));
}

export const toast = {
  success: (msg: string, title?: string) => notify(msg, 'success', title || 'Thành công'),
  error: (msg: string, title?: string) => notify(msg, 'error', title || 'Thông báo lỗi'),
  warning: (msg: string, title?: string) => notify(msg, 'warning', title || 'Cảnh báo'),
  info: (msg: string, title?: string) => notify(msg, 'info', title || 'Thông tin'),
  dismiss: (id: number) => {
    toastItems = toastItems.filter(t => t.id !== id);
    listeners.forEach(fn => fn([...toastItems]));
  }
};

function SingleToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const duration = item.duration || 5000;
  const progressRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(duration);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(item.id);
    }, 250);
  }, [item.id, onDismiss]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startTimeRef.current));
      return;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      handleClose();
    }, remainingRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPaused, handleClose]);

  const getTheme = () => {
    switch (item.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-bounce-short" />,
          accentBg: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-800',
          progressBg: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          shadow: 'shadow-emerald-900/10 border-emerald-500/30',
          defaultTitle: 'Thành công'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 animate-bounce-short" />,
          accentBg: 'bg-rose-500',
          badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-800',
          progressBg: 'bg-gradient-to-r from-rose-500 to-red-500',
          shadow: 'shadow-rose-900/10 border-rose-500/30',
          defaultTitle: 'Thao tác thất bại'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 animate-bounce-short" />,
          accentBg: 'bg-amber-500',
          badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-800',
          progressBg: 'bg-gradient-to-r from-amber-500 to-orange-400',
          shadow: 'shadow-amber-900/10 border-amber-500/30',
          defaultTitle: 'Cảnh báo hệ thống'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-500 flex-shrink-0 animate-bounce-short" />,
          accentBg: 'bg-blue-600',
          badgeBg: 'bg-blue-50 border-blue-200/80 text-blue-800',
          progressBg: 'bg-gradient-to-r from-blue-600 to-indigo-500',
          shadow: 'shadow-blue-900/10 border-blue-500/30',
          defaultTitle: 'Thông tin hệ thống'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      onClick={handleClose}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group relative w-full max-w-sm overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border-2 ${theme.shadow} shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-2xl ${
        isExiting
          ? 'opacity-0 translate-x-12 scale-95 duration-250 ease-in'
          : 'animate-in fade-in slide-in-from-top-5 duration-300'
      }`}
    >
      {/* Top Accent Strip */}
      <div className={`h-1 w-full ${theme.accentBg}`} />

      <div className="p-4 flex items-start gap-3.5">
        {/* Status Icon Wrapper with Soft Halo */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
          {theme.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-xs font-black tracking-tight text-slate-900 uppercase">
              {item.title || theme.defaultTitle}
            </h4>
          </div>
          <p className="text-xs font-bold text-slate-700 leading-snug break-words">
            {item.message}
          </p>
        </div>

        {/* Interactive Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          title="Đóng thông báo (Click hoặc chờ 5s)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated Countdown Progress Bar (5s) */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden">
        <div
          ref={progressRef}
          className={`h-full ${theme.progressBg} transition-all ease-linear`}
          style={{
            width: '100%',
            animation: `toastProgress ${duration}ms linear forwards`,
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes toastProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes bounceShort {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-short {
          animation: bounceShort 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter(l => l !== setItems);
    };
  }, []);

  const handleDismiss = useCallback((id: number) => {
    toast.dismiss(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-auto">
      {items.map(item => (
        <SingleToastCard key={item.id} item={item} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}
