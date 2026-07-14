'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api, connectWebSocket } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';

interface KDSOrder {
  id: number;
  tableId: number;
  tableName: string;
  status: string;
  createdAt: string;
  items: KDSDetail[];
}

interface KDSDetail {
  id: number;
  variantName: string;
  productName: string;
  quantity: number;
  notes: string;
  status: string;
}

type OrderStatus = 'PENDING' | 'COOKING' | 'READY';

const columns: { key: OrderStatus; label: string; color: string; bgColor: string; borderColor: string; glow: string }[] = [
  { key: 'PENDING', label: 'Chờ xử lý', color: 'text-amber-400', bgColor: 'bg-slate-900/40', borderColor: 'border-amber-500/20', glow: 'shadow-amber-500/5' },
  { key: 'COOKING', label: 'Đang nấu', color: 'text-orange-400', bgColor: 'bg-slate-900/40', borderColor: 'border-orange-500/20', glow: 'shadow-orange-500/5' },
  { key: 'READY', label: 'Sẵn sàng', color: 'text-emerald-400', bgColor: 'bg-slate-900/40', borderColor: 'border-emerald-500/20', glow: 'shadow-emerald-500/5' },
];

function timeElapsed(createdAt: string): string {
  if (!createdAt) return '—';
  const parsed = new Date(createdAt).getTime();
  if (isNaN(parsed)) return '—';
  const diff = Date.now() - parsed;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins}p`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}p`;
}

export default function KDSPage() {
  const { activeBranchId } = useAuth();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceUpdate] = useState(0);

  // Auto-refresh elapsed time labels every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate(x => x + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!activeBranchId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<KDSOrder[]>('/api/kds/orders');
      setOrders(data);
    } catch {
      toast.error('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    let mounted = true;

    function connect() {
      if (!mounted) return;
      const ws = connectWebSocket('/ws/kds');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[KDS] WebSocket connected');
        setConnected(true);
      };

      ws.onmessage = (event) => {
        const payload = event.data;
        console.log('[KDS] WebSocket message received:', payload);
        
        if (payload === 'NEW_ORDER_SUBMITTED') {
          toast.info('Có đơn hàng mới gửi xuống bếp!');
          loadOrders();
        } else if (payload === 'ORDER_STATE_CHANGED' || payload === 'ORDER_UPDATED') {
          loadOrders();
        } else if (payload.startsWith('KDS_READY_ALERT:')) {
          const tableName = payload.replace('KDS_READY_ALERT:', '');
          toast.success(`Bàn ${tableName} đã chuẩn bị xong món!`);
          loadOrders();
        } else {
          try {
            const msg = JSON.parse(payload);
            if (msg.type === 'NEW_ORDER') {
              toast.info(`Đơn mới: ${msg.data?.tableName || '#' + msg.data?.id}`);
              loadOrders();
            } else if (msg.type === 'ORDER_UPDATED') {
              loadOrders();
            } else if (msg.type === 'ORDER_CANCELLED') {
              toast.warning(`Đơn bị hủy: #${msg.data?.id}`);
              loadOrders();
            }
          } catch { /* ignore */ }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (mounted) {
          reconnectTimer.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      mounted = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [loadOrders, activeBranchId]);

  const updateStatus = async (orderId: number, status: OrderStatus | 'SERVED') => {
    try {
      await api.post('/api/kds/status', { orderId, status });
      if (status === 'SERVED') {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        toast.success(`Đơn #${orderId} đã phục vụ`);
      } else {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status } : o)
        );
        toast.success(`Đơn #${orderId} → ${columns.find(c => c.key === status)?.label}`);
      }
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const ordersByStatus = (status: OrderStatus) =>
    orders.filter(o => {
      if (status === 'PENDING') {
        return o.status === 'PENDING' || o.status === 'SENT';
      }
      return o.status === status;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <div className="text-slate-400 text-sm font-medium">Đang kết nối nhà bếp...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#0f172a] text-slate-100 overflow-hidden -m-4 lg:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b]/70 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🍳</span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">MÀN HÌNH NHÀ BẾP (KDS)</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Theo dõi chế biến thời gian thực</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-full border border-slate-800/80">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 animate-pulse'} transition-all`} />
            <span className="text-xs font-bold tracking-wide">
              {connected ? 'WEBSOCKET ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <button 
            onClick={loadOrders} 
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[#334155]/60 hover:bg-[#334155] border border-slate-700 hover:border-slate-600 rounded-xl transition-all"
          >
            <span>🔄 Làm mới</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-5 p-6 overflow-x-auto select-none">
        {columns.map(col => {
          const colOrders = ordersByStatus(col.key);
          return (
            <div key={col.key} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-[#1e293b]/30 border border-slate-800/50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
                <h2 className={`text-sm font-bold uppercase tracking-wider ${col.color}`}>{col.label}</h2>
                <span className="text-xs bg-[#1e293b] text-slate-300 font-bold px-2.5 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {colOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-2">
                    <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium uppercase tracking-wide">Chưa có đơn hàng</span>
                  </div>
                )}
                {colOrders.map(order => {
                  const elapsed = timeElapsed(order.createdAt);
                  const isUrgent = elapsed.includes('p') && parseInt(elapsed) >= 15;
                  
                  return (
                    <div
                      key={order.id}
                      className={`group relative rounded-xl border ${col.borderColor} bg-slate-900/60 p-4 transition-all duration-300 hover:border-slate-700/80 shadow-md ${col.glow}`}
                    >
                      <div className="absolute top-0 right-0 w-2 h-2 rounded-bl-lg bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-sm font-bold text-white block tracking-wide">{order.tableName || `Bàn không tên`}</span>
                          <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">MÃ ĐƠN: #{order.id}</span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                          <span>⏱</span> {elapsed}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800/60 mb-4">
                        {order.items.map(item => (
                          <div key={item.id} className="py-2 flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[11px]">{item.quantity}×</span>
                                <span className="text-slate-200 font-medium truncate">{item.productName}</span>
                              </div>
                              {item.status === 'COOKING' && <span className="text-orange-400 animate-pulse">🔥</span>}
                              {item.status === 'READY' && <span className="text-emerald-400">✓</span>}
                            </div>
                            {item.variantName && item.variantName !== item.productName && (
                              <span className="text-[10px] text-slate-400 pl-8">Biến thể: {item.variantName}</span>
                            )}
                            {item.notes && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/10 rounded px-2 py-0.5 mt-1 ml-8">
                                📝 {item.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {col.key === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(order.id, 'COOKING')}
                            className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 rounded-lg text-xs font-bold text-white shadow-md shadow-orange-950/20 transition-all"
                          >
                            🍳 Bắt đầu nấu
                          </button>
                        )}
                        {col.key === 'COOKING' && (
                          <button
                            onClick={() => updateStatus(order.id, 'READY')}
                            className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 rounded-lg text-xs font-bold text-white shadow-md shadow-emerald-950/20 transition-all"
                          >
                            ✅ Xong & Sẵn sàng
                          </button>
                        )}
                        {col.key === 'READY' && (
                          <button
                            onClick={() => updateStatus(order.id, 'SERVED')}
                            className="flex-1 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 active:scale-95 rounded-lg text-xs font-bold text-white shadow-md transition-all"
                          >
                            🍽️ Đã phục vụ khách
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
