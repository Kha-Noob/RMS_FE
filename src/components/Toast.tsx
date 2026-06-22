'use client';

import { useEffect, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let toastId = 0;
let listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(message: string, type: Toast['type'] = 'info') {
  const id = ++toastId;
  toasts = [...toasts, { id, message, type }];
  listeners.forEach(fn => fn(toasts));
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    listeners.forEach(fn => fn(toasts));
  }, 3000);
}

export const toast = {
  success: (msg: string) => notify(msg, 'success'),
  error: (msg: string) => notify(msg, 'error'),
  warning: (msg: string) => notify(msg, 'warning'),
  info: (msg: string) => notify(msg, 'info'),
};

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => { listeners = listeners.filter(l => l !== setItems); };
  }, []);

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600',
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {items.map(t => (
        <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in max-w-sm`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
