'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import type { TableEntity, Room, Product, ProductVariant, Category, CartItem, TableSession } from '@/types';

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: Category;
}

type TableStatus = 'EMPTY' | 'OCCUPIED' | 'RESERVED';

const statusColor: Record<TableStatus, string> = {
  EMPTY: 'bg-green-600 hover:bg-green-500',
  OCCUPIED: 'bg-red-600 hover:bg-red-500',
  RESERVED: 'bg-yellow-600 hover:bg-yellow-500',
};

const statusLabel: Record<TableStatus, string> = {
  EMPTY: 'Trống',
  OCCUPIED: 'Đang dùng',
  RESERVED: 'Đặt trước',
};

export default function POSPage() {
  const { activeBranchId } = useAuth();

  const [tables, setTables] = useState<TableEntity[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null);
  const [session, setSession] = useState<TableSession | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'VNPAY'>('CASH');
  const [processing, setProcessing] = useState(false);

  const [managerOpen, setManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState<'rooms' | 'tables'>('rooms');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingTable, setEditingTable] = useState<TableEntity | null>(null);
  const [roomName, setRoomName] = useState('');
  const [tableName, setTableName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableRoomId, setTableRoomId] = useState<number>(0);

  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTableIds, setMergeTableIds] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBranchId) return;
    setLoading(true);
    try {
      const branchId = activeBranchId;
      const [tableRes, roomRes, productRes] = await Promise.all([
        api.get<TableEntity[]>('/api/pos/tables', { params: { branchId } }),
        api.get<Room[]>('/api/pos/rooms', { params: { branchId } }),
        api.get<ProductWithVariants[]>('/api/pos/products', { params: { branchId } }),
      ]);
      setTables(tableRes);
      setRooms(roomRes);
      setProducts(productRes);

      const catSet = new Map<number, Category>();
      productRes.forEach(p => {
        if (p.category) catSet.set(p.category.id, p.category);
      });
      setCategories(Array.from(catSet.values()));
    } catch {
      toast.error('Không tải được dữ liệu POS');
    } finally {
      setLoading(false);
    }
  }, [activeBranchId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredTables = selectedRoom !== null
    ? tables.filter(t => t.room?.id === selectedRoom)
    : tables;

  const filteredProducts = selectedCategory !== null
    ? products.filter(p => p.category?.id === selectedCategory)
    : products;

  const loadSession = useCallback(async (table: TableEntity) => {
    try {
      const sess = await api.get<TableSession>('/api/pos/session/active', { params: { tableId: table.id } });
      setSession(sess);
      if (sess) {
        const items = await api.get<CartItem[]>(`/api/pos/session/${sess.id}/items`);
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch {
      setSession(null);
      setCartItems([]);
    }
  }, []);

  const handleSelectTable = async (table: TableEntity) => {
    setSelectedTable(table);
    setMergeMode(false);
    setMergeTableIds([]);
    setSplitMode(false);
    await loadSession(table);
  };

  const handleAddToCart = async (variant: ProductVariant) => {
    if (!session) {
      toast.warning('Chọn bàn trước khi thêm món');
      return;
    }
    setCartLoading(true);
    try {
      await api.post(`/api/pos/order/add?sessionId=${session.id}&variantId=${variant.id}&quantity=1`);
      await loadSession(selectedTable!);
      toast.success(`Đã thêm ${variant.name}`);
    } catch {
      toast.error('Thêm món thất bại');
    } finally {
      setCartLoading(false);
    }
  };

  const handleUpdateQuantity = async (detailId: number, delta: number) => {
    if (!session) return;
    setCartLoading(true);
    try {
      const item = cartItems.find(i => i.detailId === detailId);
      if (!item) return;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        await api.delete(`/api/pos/session/${session.id}/item/${detailId}`);
      } else {
        await api.put(`/api/pos/session/${session.id}/item/${detailId}`, { quantity: newQty });
      }
      await loadSession(selectedTable!);
    } catch {
      toast.error('Cập nhật số lượng thất bại');
    } finally {
      setCartLoading(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (!session) return;
    setCartLoading(true);
    try {
      await api.post('/api/pos/order/send', { sessionId: session.id });
      await loadSession(selectedTable!);
      toast.success('Đã gửi lên bếp');
    } catch {
      toast.error('Gửi bếp thất bại');
    } finally {
      setCartLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!session) return;
    setProcessing(true);
    try {
      if (paymentMethod === 'VNPAY') {
        const res = await api.post<{ paymentUrl: string }>('/api/pos/checkout/vnpay', {
          sessionId: session.id,
        });
        window.location.href = res.paymentUrl;
        return;
      }
      await api.post('/api/pos/checkout/confirm', {
        sessionId: session.id,
        paymentMethod,
      });
      toast.success('Thanh toán thành công');
      setCheckoutOpen(false);
      setSession(null);
      setCartItems([]);
      setSelectedTable(null);
      await loadData();
    } catch {
      toast.error('Thanh toán thất bại');
    } finally {
      setProcessing(false);
    }
  };

  const handleMergeBills = async () => {
    if (mergeTableIds.length < 2) {
      toast.warning('Chọn ít nhất 2 bàn để gộp');
      return;
    }
    try {
      await api.post('/api/pos/bill/merge', { tableIds: mergeTableIds });
      toast.success('Gộp bàn thành công');
      setMergeMode(false);
      setMergeTableIds([]);
      await loadData();
    } catch {
      toast.error('Gộp bàn thất bại');
    }
  };

  const handleSplitBill = async () => {
    if (!selectedTable) return;
    try {
      await api.post('/api/pos/bill/split', { tableId: selectedTable.id });
      toast.success('Tách bill thành công');
      setSplitMode(false);
      await loadSession(selectedTable);
    } catch {
      toast.error('Tách bill thất bại');
    }
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim()) {
      toast.warning('Nhập tên phòng');
      return;
    }
    try {
      if (editingRoom) {
        await api.put(`/api/pos/rooms/${editingRoom.id}`, { name: roomName.trim() });
        toast.success('Cập nhật phòng thành công');
      } else {
        await api.post('/api/pos/rooms/add', { name: roomName.trim(), branchId: activeBranchId });
        toast.success('Thêm phòng thành công');
      }
      setEditingRoom(null);
      setRoomName('');
      const roomRes = await api.get<Room[]>('/api/pos/rooms', { params: { branchId: activeBranchId! } });
      setRooms(roomRes);
    } catch {
      toast.error('Lưu phòng thất bại');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Xóa phòng này?')) return;
    try {
      await api.delete(`/api/pos/rooms/${id}`);
      toast.success('Xóa phòng thành công');
      setRooms(r => r.filter(room => room.id !== id));
    } catch {
      toast.error('Xóa phòng thất bại');
    }
  };

  const handleSaveTable = async () => {
    if (!tableName.trim()) {
      toast.warning('Nhập tên bàn');
      return;
    }
    try {
      const payload = {
        name: tableName.trim(),
        capacity: tableCapacity,
        roomId: tableRoomId || rooms[0]?.id,
        branchId: activeBranchId,
      };
      if (editingTable) {
        await api.put(`/api/pos/tables/${editingTable.id}`, payload);
        toast.success('Cập nhật bàn thành công');
      } else {
        await api.post('/api/pos/tables/add', payload);
        toast.success('Thêm bàn thành công');
      }
      setEditingTable(null);
      setTableName('');
      setTableCapacity(4);
      const tableRes = await api.get<TableEntity[]>('/api/pos/tables', { params: { branchId: activeBranchId! } });
      setTables(tableRes);
    } catch {
      toast.error('Lưu bàn thất bại');
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm('Xóa bàn này?')) return;
    try {
      await api.delete(`/api/pos/tables/${id}`);
      toast.success('Xóa bàn thành công');
      setTables(t => t.filter(table => table.id !== id));
    } catch {
      toast.error('Xóa bàn thất bại');
    }
  };

  const toggleMergeTable = (id: number) => {
    setMergeTableIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-950">
        <div className="text-gray-400 text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-0px)] bg-gray-950 text-white overflow-hidden">
      {/* LEFT: Table Map */}
      <div className="w-72 min-w-[280px] border-r border-gray-800 flex flex-col bg-gray-900">
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Bàn</h2>
          <div className="flex gap-1">
            {mergeMode && (
              <button
                onClick={handleMergeBills}
                className="px-2 py-1 text-xs bg-purple-600 rounded hover:bg-purple-500"
              >
                Gộp ({mergeTableIds.length})
              </button>
            )}
            <button
              onClick={() => { setManagerOpen(true); setManagerTab('rooms'); }}
              className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
            >
              ⚙
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-2 overflow-x-auto border-b border-gray-800">
          <button
            onClick={() => setSelectedRoom(null)}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedRoom === null ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tất cả
          </button>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                selectedRoom === room.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredTables.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-8">Không có bàn</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredTables.map(table => {
                const isSelected = selectedTable?.id === table.id;
                const isMergeSelected = mergeTableIds.includes(table.id);
                return (
                  <button
                    key={table.id}
                    onClick={() => {
                      if (mergeMode) {
                        if (table.status === 'OCCUPIED' || isSelected) toggleMergeTable(table.id);
                      } else {
                        handleSelectTable(table);
                      }
                    }}
                    className={`relative p-3 rounded-lg text-center transition-all ${
                      statusColor[table.status as TableStatus] || 'bg-gray-700'
                    } ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''} ${
                      isMergeSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900' : ''
                    }`}
                  >
                    <div className="text-xs font-bold">{table.name}</div>
                    <div className="text-[10px] mt-1 opacity-75">{table.capacity} chỗ</div>
                    {table.status !== 'EMPTY' && (
                      <div className="text-[9px] mt-0.5">{statusLabel[table.status as TableStatus]}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-800 flex gap-1">
          <button
            onClick={() => { setMergeMode(!mergeMode); setMergeTableIds([]); }}
            className={`flex-1 py-2 text-xs rounded transition-colors ${
              mergeMode ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Gộp bàn
          </button>
          <button
            onClick={() => setSplitMode(!splitMode)}
            className={`flex-1 py-2 text-xs rounded transition-colors ${
              splitMode ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            disabled={!selectedTable || selectedTable.status !== 'OCCUPIED'}
          >
            Tách bill
          </button>
        </div>
      </div>

      {/* CENTER: Menu */}
      <div className="flex-1 flex flex-col bg-gray-950 min-w-0">
        <div className="flex items-center gap-1 p-3 overflow-x-auto border-b border-gray-800">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
              selectedCategory === null ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="text-gray-500 text-sm text-center mt-8">Không có sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors border border-gray-700 hover:border-gray-600"
                >
                  <div className="p-3">
                    <div className="text-sm font-medium text-white truncate">{product.name}</div>
                    {product.category && (
                      <div className="text-[10px] text-gray-500 mt-0.5">{product.category.name}</div>
                    )}
                  </div>
                  {product.variants && product.variants.length > 0 && (
                    <div className="border-t border-gray-700 divide-y divide-gray-700">
                      {product.variants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => handleAddToCart(variant)}
                          disabled={!session || cartLoading}
                          className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
                        >
                          <span className="text-xs text-gray-300 truncate mr-2">{variant.name}</span>
                          <span className="text-xs font-semibold text-green-400 whitespace-nowrap">
                            {variant.price.toLocaleString('vi-VN')}đ
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="w-80 min-w-[300px] border-l border-gray-800 flex flex-col bg-gray-900">
        <div className="p-3 border-b border-gray-800">
          {selectedTable ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selectedTable.name}</h3>
                <p className="text-[11px] text-gray-500">
                  {session ? `Phiên #${session.id}` : 'Chưa có phiên'}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                selectedTable.status === 'OCCUPIED' ? 'bg-red-900 text-red-300' :
                selectedTable.status === 'RESERVED' ? 'bg-yellow-900 text-yellow-300' :
                'bg-green-900 text-green-300'
              }`}>
                {statusLabel[selectedTable.status as TableStatus]}
              </span>
            </div>
          ) : (
            <h3 className="text-sm text-gray-500">Chọn bàn để bắt đầu</h3>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="text-gray-600 text-sm text-center mt-8">
              {session ? 'Chưa có món' : 'Chọn bàn và bắt đầu đặt món'}
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.detailId}
                className={`bg-gray-800 rounded-lg p-3 border border-gray-700 ${
                  item.status === 'COOKING' ? 'border-orange-600' :
                  item.status === 'READY' ? 'border-green-600' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{item.productName}</div>
                    <div className="text-[11px] text-gray-400">{item.variantName}</div>
                    {item.notes && (
                      <div className="text-[10px] text-gray-500 mt-1 italic">{item.notes}</div>
                    )}
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {item.status === 'PENDING' && '⏳ Chờ xử lý'}
                      {item.status === 'COOKING' && '🔥 Đang nấu'}
                      {item.status === 'READY' && '✅ Sẵn sàng'}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-400 ml-2">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.detailId, -1)}
                      disabled={cartLoading}
                      className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.detailId, 1)}
                      disabled={cartLoading}
                      className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Actions */}
        <div className="border-t border-gray-800 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Tổng cộng</span>
            <span className="text-lg font-bold text-green-400">{total.toLocaleString('vi-VN')}đ</span>
          </div>
          <button
            onClick={handleSendToKitchen}
            disabled={!session || cartItems.length === 0 || cartLoading}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cartLoading ? 'Đang xử lý...' : '🔥 Gửi bếp'}
          </button>
          <button
            onClick={() => setCheckoutOpen(true)}
            disabled={!session || cartItems.length === 0}
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💳 Thanh toán
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Thanh toán</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Tổng tiền</div>
                <div className="text-2xl font-bold text-green-400">{total.toLocaleString('vi-VN')}đ</div>
              </div>

              <div>
                <div className="text-sm text-gray-400 mb-2">Phương thức thanh toán</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'CASH' as const, label: '💵 Tiền mặt', desc: 'Thanh toán bằng tiền mặt' },
                    { key: 'BANK_TRANSFER' as const, label: '🏦 Chuyển khoản / VietQR', desc: 'Chuyển khoản ngân hàng' },
                    { key: 'VNPAY' as const, label: '📱 VNPay QR', desc: 'Quét mã QR VNPay' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setPaymentMethod(opt.key)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        paymentMethod === opt.key
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-[11px] text-gray-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Modal */}
      {managerOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold">Quản lý bàn & phòng</h3>
              <button onClick={() => { setManagerOpen(false); setEditingRoom(null); setEditingTable(null); }} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setManagerTab('rooms')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  managerTab === 'rooms' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Phòng
              </button>
              <button
                onClick={() => setManagerTab('tables')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  managerTab === 'tables' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bàn
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {managerTab === 'rooms' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                      placeholder="Tên phòng..."
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      onKeyDown={e => e.key === 'Enter' && handleSaveRoom()}
                    />
                    <button onClick={handleSaveRoom} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm">
                      {editingRoom ? 'Cập nhật' : 'Thêm'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {rooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between p-2 bg-gray-900 rounded-lg group">
                        <span className="text-sm text-gray-300">{room.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingRoom(room); setRoomName(room.name); }}
                            className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="px-2 py-1 text-xs bg-red-800 rounded hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {rooms.length === 0 && <div className="text-gray-500 text-sm text-center py-4">Chưa có phòng</div>}
                  </div>
                </div>
              )}

              {managerTab === 'tables' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={tableName}
                      onChange={e => setTableName(e.target.value)}
                      placeholder="Tên bàn..."
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      value={tableCapacity}
                      onChange={e => setTableCapacity(parseInt(e.target.value) || 1)}
                      min={1}
                      placeholder="Số chỗ"
                      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                    <select
                      value={tableRoomId}
                      onChange={e => setTableRoomId(parseInt(e.target.value))}
                      className="col-span-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={0}>-- Chọn phòng --</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveTable} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm">
                      {editingTable ? 'Cập nhật' : 'Thêm bàn'}
                    </button>
                    {editingTable && (
                      <button
                        onClick={() => { setEditingTable(null); setTableName(''); setTableCapacity(4); }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 mt-2">
                    {tables.map(table => (
                      <div key={table.id} className="flex items-center justify-between p-2 bg-gray-900 rounded-lg group">
                        <div>
                          <span className="text-sm text-gray-300">{table.name}</span>
                          <span className="text-[10px] text-gray-500 ml-2">{table.capacity} chỗ · {table.room?.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTable(table);
                              setTableName(table.name);
                              setTableCapacity(table.capacity);
                              setTableRoomId(table.room?.id || 0);
                            }}
                            className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="px-2 py-1 text-xs bg-red-800 rounded hover:bg-red-700"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {tables.length === 0 && <div className="text-gray-500 text-sm text-center py-4">Chưa có bàn</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
