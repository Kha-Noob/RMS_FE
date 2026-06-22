'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { api, connectWebSocket } from '@/lib/api';
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

const columns: { key: OrderStatus; label: string; color: string; bgColor: string }[] = [
  { key: 'PENDING', label: 'Chờ xử lý', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30 border-yellow-700' },
  { key: 'COOKING', label: 'Đang nấu', color: 'text-orange-400', bgColor: 'bg-orange-900/30 border-orange-700' },
  { key: 'READY', label: 'Sẵn sàng', color: 'text-green-400', bgColor: 'bg-green-900/30 border-green-700' },
];

function timeElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}p`;
}

export default function KDSPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.get<KDSOrder[]>('/api/kds/orders');
      setOrders(data);
    } catch {
      toast.error('Không tải được đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

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
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_ORDER') {
            toast.info(`Đơn mới: ${msg.data?.tableName || '#' + msg.data?.id}`);
            loadOrders();
          } else if (msg.type === 'ORDER_UPDATED') {
            loadOrders();
          } else if (msg.type === 'ORDER_CANCELLED') {
            toast.warning(`Đơn bị hủy: #${msg.data?.id}`);
            loadOrders();
          }
        } catch { /* ignore malformed */ }
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
  }, [loadOrders]);

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await api.post('/api/kds/status', { orderId, status });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status } : o)
      );
      toast.success(`Đơn #${orderId} → ${columns.find(c => c.key === status)?.label}`);
    } catch {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  const ordersByStatus = (status: OrderStatus) =>
    orders.filter(o => o.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-gray-400 text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <h1 className="text-lg font-bold">🍳 Kitchen Display System</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${wsRef.current?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">
              {wsRef.current?.readyState === WebSocket.OPEN ? 'Đã kết nối' : 'Mất kết nối'}
            </span>
          </div>
          <button onClick={loadOrders} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg">
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
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 && (
                  <div className="text-gray-700 text-sm text-center py-8">Trống</div>
                )}
                {colOrders.map(order => (
                  <div
                    key={order.id}
                    className={`rounded-lg border p-3 ${col.bgColor} transition-all`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{order.tableName || `#${order.id}`}</span>
                        <span className="text-[10px] text-gray-500">#{order.id}</span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        ⏱ {timeElapsed(order.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-medium text-gray-200">{item.quantity}×</span>
                            <span className="text-gray-300 truncate">{item.productName}</span>
                            {item.variantName !== item.productName && (
                              <span className="text-gray-500 truncate">({item.variantName})</span>
                            )}
                          </div>
                          {item.status === 'COOKING' && <span className="text-orange-400">🔥</span>}
                          {item.status === 'READY' && <span className="text-green-400">✓</span>}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1">
                      {col.key === 'PENDING' && (
                        <button
                          onClick={() => updateStatus(order.id, 'COOKING')}
                          className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 rounded text-xs font-medium transition-colors"
                        >
                          🔥 Bắt đầu nấu
                        </button>
                      )}
                      {col.key === 'COOKING' && (
                        <button
                          onClick={() => updateStatus(order.id, 'READY')}
                          className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 rounded text-xs font-medium transition-colors"
                        >
                          ✅ Đánh dấu sẵn sàng
                        </button>
                      )}
                      {col.key === 'READY' && (
                        <span className="flex-1 py-1.5 bg-gray-800 rounded text-xs font-medium text-center text-gray-500">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
