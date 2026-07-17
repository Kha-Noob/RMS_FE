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

const columns: { key: OrderStatus; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { key: 'PENDING', label: 'Chờ xử lý', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'COOKING', label: 'Đang nấu', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'READY', label: 'Sẵn sàng', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
];

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.debug('Audio play blocked:', err);
  }
}

function getWaitingTimeMinutes(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.floor(diff / 60000);
}

function timeElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}p`;
}

export default function KDSPage() {
  const { activeBranchId } = useAuth();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
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
      };

      ws.onmessage = (event) => {
        const text = event.data;
        if (text === 'NEW_ORDER_SUBMITTED' || text === 'ORDER_STATE_CHANGED') {
          loadOrders();
          if (text === 'NEW_ORDER_SUBMITTED') {
            playNotificationSound();
          }
          return;
        }

        try {
          const msg = JSON.parse(text);
          if (msg.type === 'NEW_ORDER' || msg.type === 'NEW_ORDER_SUBMITTED') {
            toast.info(`Đơn mới: ${msg.data?.tableName || '#' + msg.data?.id}`);
            playNotificationSound();
            loadOrders();
          } else if (msg.type === 'ORDER_UPDATED' || msg.type === 'ORDER_STATE_CHANGED') {
            loadOrders();
          } else if (msg.type === 'ORDER_CANCELLED') {
            toast.warning(`Đơn bị hủy: #${msg.data?.id}`);
            loadOrders();
          }
        } catch {
          // If JSON parse fails, reload anyway to keep in sync
          loadOrders();
        }
      };

      ws.onclose = () => {
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

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await api.post('/api/kds/status', null, { params: { orderId, status } });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status } : o)
      );
      toast.success(`Đơn #${orderId} → ${columns.find(c => c.key === status)?.label}`);
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
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f8f9fc] overflow-hidden -m-4 lg:-m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold text-slate-800">🍳 Kitchen Display System</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${wsRef.current?.readyState === WebSocket.OPEN ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-400">
              {wsRef.current?.readyState === WebSocket.OPEN ? 'Đã kết nối' : 'Mất kết nối'}
            </span>
          </div>
          <button onClick={loadOrders} className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
            🔄 Làm mới
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {columns.map(col => {
          const colOrders = ordersByStatus(col.key);
          return (
            <div key={col.key} className="flex-1 min-w-[300px] flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <h2 className={`text-sm font-semibold ${col.color}`}>{col.label}</h2>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 && (
                  <div className="text-slate-300 text-sm text-center py-8">Trống</div>
                )}
                {colOrders.map(order => {
                  const waitingMins = getWaitingTimeMinutes(order.createdAt);
                  let waitColorClass = 'border-slate-200 bg-white';
                  if (order.status !== 'READY') {
                    if (waitingMins >= 20) {
                      waitColorClass = 'border-rose-300 bg-rose-50/50 shadow-rose-100/30 animate-pulse';
                    } else if (waitingMins >= 10) {
                      waitColorClass = 'border-amber-300 bg-amber-50/50';
                    } else {
                      waitColorClass = 'border-emerald-200 bg-emerald-50/20';
                    }
                  } else {
                    waitColorClass = 'border-slate-200 bg-slate-50/60';
                  }

                  return (
                    <div
                      key={order.id}
                      className={`rounded-xl border p-3 transition-all shadow-sm ${waitColorClass}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{order.tableName || `#${order.id}`}</span>
                          <span className="text-[10px] text-slate-400">#{order.id}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          ⏱ {timeElapsed(order.createdAt)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="font-medium text-slate-700">{item.quantity}×</span>
                              <span className="text-slate-600 truncate">{item.productName}</span>
                              {item.variantName !== item.productName && (
                                <span className="text-slate-400 truncate">({item.variantName})</span>
                              )}
                            </div>
                            {item.status === 'COOKING' && <span className="text-orange-500">🔥</span>}
                            {item.status === 'READY' && <span className="text-emerald-500">✓</span>}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1">
                        {col.key === 'PENDING' && (
                          <button
                            onClick={() => updateStatus(order.id, 'COOKING')}
                            className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-400 rounded-lg text-xs font-medium text-white transition-colors"
                          >
                            🔥 Bắt đầu nấu
                          </button>
                        )}
                        {col.key === 'COOKING' && (
                          <button
                            onClick={() => updateStatus(order.id, 'READY')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium text-white transition-colors"
                          >
                            ✅ Đánh dấu sẵn sàng
                          </button>
                        )}
                        {col.key === 'READY' && (
                          <span className="flex-1 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-center text-slate-400">
                            Đã hoàn thành
                          </span>
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
