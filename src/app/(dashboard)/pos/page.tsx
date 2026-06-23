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
    if (!activeBranchId) {
      setLoading(false);
      return;
    }
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
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!activeBranchId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center space-y-2">
          <div className="text-slate-500 text-lg">Vui lòng chọn chi nhánh</div>
          <div className="text-slate-400 text-sm">Chọn chi nhánh từ menu bên trái để bắt đầu</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8f9fc] text-slate-800 overflow-hidden -m-4 lg:-m-6">
      {/* LEFT: Table Map */}
      <div className="w-72 min-w-[280px] border-r border-slate-200 flex flex-col bg-white">
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Bàn</h2>
          <div className="flex gap-1">
            {mergeMode && (
              <button
                onClick={handleMergeBills}
                className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-500"
              >
                Gộp ({mergeTableIds.length})
              </button>
            )}
            <button
              onClick={() => { setManagerOpen(true); setManagerTab('rooms'); }}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
            >
              ⚙
            </button>
          </div>
        </div>

        <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-200">
          <button
            onClick={() => setSelectedRoom(null)}
            className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedRoom === null ? 'bg-[#25439b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                selectedRoom === room.id ? 'bg-[#25439b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredTables.length === 0 ? (
            <div className="text-slate-400 text-sm text-center mt-8">Không có bàn</div>
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
                    className={`relative p-3 rounded-lg text-center transition-all text-white ${
                      statusColor[table.status as TableStatus] || 'bg-slate-400'
                    } ${isSelected ? 'ring-2 ring-[#25439b] ring-offset-2 ring-offset-white' : ''} ${
                      isMergeSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-white' : ''
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

        <div className="p-2 border-t border-slate-200 flex gap-1">
          <button
            onClick={() => { setMergeMode(!mergeMode); setMergeTableIds([]); }}
            className={`flex-1 py-2 text-xs rounded transition-colors ${
              mergeMode ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Gộp bàn
          </button>
          <button
            onClick={() => setSplitMode(!splitMode)}
            className={`flex-1 py-2 text-xs rounded transition-colors ${
              splitMode ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            disabled={!selectedTable || selectedTable.status !== 'OCCUPIED'}
          >
            Tách bill
          </button>
        </div>
      </div>

      {/* CENTER: Menu */}
      <div className="flex-1 flex flex-col bg-[#f8f9fc] min-w-0">
        <div className="flex items-center gap-1 p-3 overflow-x-auto border-b border-slate-200 bg-white">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
              selectedCategory === null ? 'bg-[#25439b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
                selectedCategory === cat.id ? 'bg-[#25439b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="text-slate-400 text-sm text-center mt-8">Không có sản phẩm</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden transition-colors border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="p-3">
                    <div className="text-sm font-medium text-slate-800 truncate">{product.name}</div>
                    {product.category && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{product.category.name}</div>
                    )}
                  </div>
                  {product.variants && product.variants.length > 0 && (
                    <div className="border-t border-slate-100 divide-y divide-slate-100">
                      {product.variants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => handleAddToCart(variant)}
                          disabled={!session || cartLoading}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
                        >
                          <span className="text-xs text-slate-600 truncate mr-2">{variant.name}</span>
                          <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
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
      <div className="w-80 min-w-[300px] border-l border-slate-200 flex flex-col bg-white">
        <div className="p-3 border-b border-slate-200">
          {selectedTable ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-800">{selectedTable.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {session ? `Phiên #${session.id}` : 'Chưa có phiên'}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                selectedTable.status === 'OCCUPIED' ? 'bg-red-50 text-red-600' :
                selectedTable.status === 'RESERVED' ? 'bg-amber-50 text-amber-600' :
                'bg-emerald-50 text-emerald-600'
              }`}>
                {statusLabel[selectedTable.status as TableStatus]}
              </span>
            </div>
          ) : (
            <h3 className="text-sm text-slate-400">Chọn bàn để bắt đầu</h3>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="text-slate-400 text-sm text-center mt-8">
              {session ? 'Chưa có món' : 'Chọn bàn và bắt đầu đặt món'}
            </div>
          ) : (
            cartItems.map(item => (
              <div
                key={item.detailId}
                className={`bg-slate-50 rounded-lg p-3 border ${
                  item.status === 'COOKING' ? 'border-orange-300 bg-orange-50' :
                  item.status === 'READY' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{item.productName}</div>
                    <div className="text-[11px] text-slate-500">{item.variantName}</div>
                    {item.notes && (
                      <div className="text-[10px] text-slate-400 mt-1 italic">{item.notes}</div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {item.status === 'PENDING' && '⏳ Chờ xử lý'}
                      {item.status === 'COOKING' && '🔥 Đang nấu'}
                      {item.status === 'READY' && '✅ Sẵn sàng'}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-emerald-600 ml-2">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(item.detailId, -1)}
                      disabled={cartLoading}
                      className="w-7 h-7 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-sm w-6 text-center text-slate-700">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.detailId, 1)}
                      disabled={cartLoading}
                      className="w-7 h-7 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm text-slate-600 disabled:opacity-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total & Actions */}
        <div className="border-t border-slate-200 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Tổng cộng</span>
            <span className="text-lg font-bold text-emerald-600">{total.toLocaleString('vi-VN')}đ</span>
          </div>
          <button
            onClick={handleSendToKitchen}
            disabled={!session || cartItems.length === 0 || cartLoading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cartLoading ? 'Đang xử lý...' : '🔥 Gửi bếp'}
          </button>
          <button
            onClick={() => setCheckoutOpen(true)}
            disabled={!session || cartItems.length === 0}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💳 Thanh toán
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Thanh toán</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-1">Tổng tiền</div>
                <div className="text-2xl font-bold text-emerald-600">{total.toLocaleString('vi-VN')}đ</div>
              </div>

              <div>
                <div className="text-sm text-slate-500 mb-2">Phương thức thanh toán</div>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { key: 'CASH' as const, label: '💵 Tiền mặt', desc: 'Thanh toán bằng tiền mặt' },
                    { key: 'BANK_TRANSFER' as const, label: '🏦 Chuyển khoản / VietQR', desc: 'Chuyển khoản ngân hàng' },
                    { key: 'VNPAY' as const, label: '📱 VNPay QR', desc: 'Quét mã QR VNPay' },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setPaymentMethod(opt.key)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === opt.key
                          ? 'border-[#25439b] bg-[#25439b]/5 ring-1 ring-[#25439b]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-800">{opt.label}</div>
                      <div className="text-[11px] text-slate-400">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
              >
                {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Modal */}
      {managerOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Quản lý bàn & phòng</h3>
              <button onClick={() => { setManagerOpen(false); setEditingRoom(null); setEditingTable(null); }} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
            </div>

            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setManagerTab('rooms')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  managerTab === 'rooms' ? 'border-b-2 border-[#25439b] text-[#25439b]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Phòng
              </button>
              <button
                onClick={() => setManagerTab('tables')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  managerTab === 'tables' ? 'border-b-2 border-[#25439b] text-[#25439b]' : 'text-slate-400 hover:text-slate-600'
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
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20"
                      onKeyDown={e => e.key === 'Enter' && handleSaveRoom()}
                    />
                    <button onClick={handleSaveRoom} className="px-4 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg text-sm transition-colors">
                      {editingRoom ? 'Cập nhật' : 'Thêm'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {rooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                        <span className="text-sm text-slate-700">{room.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingRoom(room); setRoomName(room.name); }}
                            className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {rooms.length === 0 && <div className="text-slate-400 text-sm text-center py-4">Chưa có phòng</div>}
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
                      className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20"
                    />
                    <input
                      type="number"
                      value={tableCapacity}
                      onChange={e => setTableCapacity(parseInt(e.target.value) || 1)}
                      min={1}
                      placeholder="Số chỗ"
                      className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20"
                    />
                    <select
                      value={tableRoomId}
                      onChange={e => setTableRoomId(parseInt(e.target.value))}
                      className="col-span-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20"
                    >
                      <option value={0}>-- Chọn phòng --</option>
                      {rooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveTable} className="flex-1 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg text-sm transition-colors">
                      {editingTable ? 'Cập nhật' : 'Thêm bàn'}
                    </button>
                    {editingTable && (
                      <button
                        onClick={() => { setEditingTable(null); setTableName(''); setTableCapacity(4); }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition-colors"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 mt-2">
                    {tables.map(table => (
                      <div key={table.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                        <div>
                          <span className="text-sm text-slate-700">{table.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{table.capacity} chỗ · {table.room?.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingTable(table);
                              setTableName(table.name);
                              setTableCapacity(table.capacity);
                              setTableRoomId(table.room?.id || 0);
                            }}
                            className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {tables.length === 0 && <div className="text-slate-400 text-sm text-center py-4">Chưa có bàn</div>}
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
