'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import type { TableEntity, Room, Product, ProductVariant, Category, CartItem, TableSession } from '@/types';

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: Category;
}

interface ActiveSessionResponse {
  sessionId: number;
  tableId: number;
  tableName: string;
  status: string;
  items: CartItem[];
  total: number;
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

const statusDotColor: Record<TableStatus, string> = {
  EMPTY: 'bg-green-500',
  OCCUPIED: 'bg-red-500',
  RESERVED: 'bg-yellow-500',
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

  const [panoramaOpen, setPanoramaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedRoomObj = rooms.find(r => r.id === selectedRoom);
  const showFloorPlan = selectedRoomObj?.floorPlanImageUrl && selectedRoom !== null;

  const mountedRef = useRef(true);
  const loadIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    if (!activeBranchId) {
      setLoading(false);
      return;
    }
    const thisLoad = ++loadIdRef.current;
    setLoading(true);

    let tablesOk = false;
    let roomsOk = false;
    let productsOk = false;

    try {
      const branchId = activeBranchId;
      const results = await Promise.allSettled([
        api.get<TableEntity[]>('/api/pos/tables', { params: { branchId } }),
        api.get<Room[]>('/api/pos/rooms', { params: { branchId } }),
        api.get<ProductWithVariants[]>('/api/pos/products', { params: { branchId } }),
      ]);

      if (!mountedRef.current || thisLoad !== loadIdRef.current) return;

      const [tablesResult, roomsResult, productsResult] = results;

      if (tablesResult.status === 'fulfilled') {
        setTables(tablesResult.value);
        tablesOk = true;
      }
      if (roomsResult.status === 'fulfilled') {
        setRooms(roomsResult.value);
        roomsOk = true;
      }
      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value);
        productsOk = true;

        const catSet = new Map<number, Category>();
        productsResult.value.forEach(p => {
          if (p.category) catSet.set(p.category.id, p.category);
        });
        setCategories(Array.from(catSet.values()));
      }

      if (!tablesOk && !roomsOk && !productsOk) {
        toast.error('Không tải được dữ liệu POS');
      } else if (!productsOk) {
        toast.warning('Tải thực đơn thất bại');
      } else if (!tablesOk || !roomsOk) {
        toast.warning('Tải bàn/phòng thất bại');
      }
    } catch {
      if (mountedRef.current && thisLoad === loadIdRef.current) {
        toast.error('Không tải được dữ liệu POS');
      }
    } finally {
      if (mountedRef.current && thisLoad === loadIdRef.current) {
        setLoading(false);
      }
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
      const res = await api.get<ActiveSessionResponse>('/api/pos/session/active', { params: { tableId: table.id } });
      const tblSession: TableSession = {
        id: res.sessionId,
        table: table,
        status: res.status,
      };
      setSession(tblSession);
      setCartItems(res.items || []);
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
      await api.postForm('/api/pos/order/add', {
        sessionId: session.id,
        variantId: variant.id,
        quantity: 1,
      });
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
        await api.put(`/api/pos/session/${session.id}/item/${detailId}`, null, {
          params: { quantity: newQty },
        });
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
      await api.postForm('/api/pos/order/send', { sessionId: session.id });
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
        const res = await api.postForm<{ qrData: string }>('/api/pos/checkout/vnpay', {
          sessionId: session.id,
        });
        toast.info(res.qrData);
        return;
      }
      await api.postForm('/api/pos/checkout/confirm', {
        sessionId: session.id,
        amount: total,
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
      const sourceTableId = mergeTableIds[0];
      const targetTableId = mergeTableIds[1];
      const sourceTable = tables.find(t => t.id === sourceTableId);
      const targetTable = tables.find(t => t.id === targetTableId);
      if (!sourceTable || !targetTable) {
        toast.error('Không tìm thấy bàn');
        return;
      }
      const sourceSession = await api.get<ActiveSessionResponse>('/api/pos/session/active', { params: { tableId: sourceTableId } }).catch(() => null);
      const targetSession = await api.get<ActiveSessionResponse>('/api/pos/session/active', { params: { tableId: targetTableId } }).catch(() => null);
      if (!sourceSession || !targetSession) {
        toast.error('Cần 2 bàn đang có phiên hoạt động để gộp');
        return;
      }
      await api.postForm('/api/pos/bill/merge', {
        sourceSessionId: sourceSession.sessionId,
        targetSessionId: targetSession.sessionId,
      });
      toast.success('Gộp bàn thành công');
      setMergeMode(false);
      setMergeTableIds([]);
      await loadData();
    } catch {
      toast.error('Gộp bàn thất bại');
    }
  };

  const handleSplitBill = async () => {
    if (!selectedTable || !session) return;
    try {
      await api.postForm('/api/pos/bill/split', {
        sessionId: session.id,
        detailIds: cartItems.map(i => i.detailId).join(','),
      });
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
        await api.postForm('/api/pos/rooms/update', {
          roomId: editingRoom.id,
          name: roomName.trim(),
        });
        toast.success('Cập nhật phòng thành công');
      } else {
        await api.postForm('/api/pos/rooms/add', {
          name: roomName.trim(),
        });
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
      await api.postForm('/api/pos/rooms/delete', { roomId: id });
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
    const roomId = tableRoomId || rooms[0]?.id;
    if (!roomId) {
      toast.warning('Chọn phòng cho bàn');
      return;
    }
    try {
      if (editingTable) {
        await api.postForm('/api/pos/tables/update', {
          tableId: editingTable.id,
          name: tableName.trim(),
          capacity: tableCapacity,
          roomId,
        });
        toast.success('Cập nhật bàn thành công');
      } else {
        await api.postForm('/api/pos/tables/add', {
          name: tableName.trim(),
          capacity: tableCapacity,
          roomId,
        });
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
      await api.postForm('/api/pos/tables/delete', { tableId: id });
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
      {/* ═══════════════════════════════════════════════════════════════
          MAIN AREA: Floor Plan / Table Map (takes up most of the screen)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar: Room tabs + actions */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-200">
          <div className="flex gap-1 overflow-x-auto flex-1">
            <button
              onClick={() => setSelectedRoom(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedRoom === null ? 'bg-[#25439b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedRoom === room.id ? 'bg-[#25439b] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {selectedRoomObj?.panoramaUrl && (
              <button
                onClick={() => setPanoramaOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                360°
              </button>
            )}
            <button
              onClick={() => { setManagerOpen(true); setManagerTab('rooms'); }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Quản lý bàn & phòng"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>

        {/* Floor plan canvas / Table grid */}
        <div className="flex-1 overflow-auto p-4">
          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <svg className="w-12 h-12 mb-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              <div className="text-sm">Không có bàn</div>
              {selectedRoom && <div className="text-xs mt-1">Thử chọn phòng khác</div>}
            </div>
          ) : showFloorPlan ? (
            <div
              className="relative mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              style={{
                maxWidth: '100%',
                aspectRatio: (selectedRoomObj!.floorPlanWidth && selectedRoomObj!.floorPlanHeight)
                  ? `${selectedRoomObj!.floorPlanWidth} / ${selectedRoomObj!.floorPlanHeight}`
                  : '5 / 4',
              }}
            >
              {/* Background 2D floor diagram */}
              <img
                src={selectedRoomObj!.floorPlanImageUrl!}
                alt="Sơ đồ tầng"
                className="absolute inset-0 w-full h-full object-contain"
                draggable={false}
              />
              {/* Table markers overlay */}
              {filteredTables.map(table => {
                const isSelected = selectedTable?.id === table.id;
                const isMergeSelected = mergeTableIds.includes(table.id);
                const radius = table.layoutRadius || 25;
                const x = table.layoutX ?? 50;
                const y = table.layoutY ?? 50;
                const markerColor = statusColor[table.status as TableStatus] || '#94a3b8';
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
                    className="absolute cursor-pointer transition-all duration-150"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: radius * 2,
                      height: radius * 2,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isSelected ? 20 : isMergeSelected ? 15 : 10,
                    }}
                    title={`${table.name} — ${table.capacity} chỗ — ${statusLabel[table.status as TableStatus]}`}
                  >
                    <div className="absolute inset-0 rounded-full" style={{ boxShadow: isSelected ? '0 0 0 3px rgba(37,67,155,0.4), 0 4px 12px rgba(0,0,0,0.3)' : isMergeSelected ? '0 0 0 3px rgba(168,85,247,0.4), 0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.25)' }} />
                    <div
                      className="absolute inset-0 rounded-full flex items-center justify-center border-2 transition-all"
                      style={{
                        backgroundColor: markerColor,
                        borderColor: isSelected ? '#25439b' : isMergeSelected ? '#a855f7' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <span className="text-white text-[10px] font-bold leading-none select-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {table.displayLabel || table.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
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
                    className={`relative p-4 rounded-xl text-center transition-all text-white ${
                      statusColor[table.status as TableStatus] || 'bg-slate-400'
                    } ${isSelected ? 'ring-2 ring-[#25439b] ring-offset-2 ring-offset-white scale-105' : 'hover:scale-105'} ${
                      isMergeSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-white' : ''
                    }`}
                  >
                    <div className="text-sm font-bold">{table.name}</div>
                    <div className="text-[11px] mt-1 opacity-75">{table.capacity} chỗ</div>
                    {table.status !== 'EMPTY' && (
                      <div className="text-[10px] mt-0.5 opacity-80">{statusLabel[table.status as TableStatus]}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom bar: Merge/Split actions */}
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={() => { setMergeMode(!mergeMode); setMergeTableIds([]); }}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              mergeMode ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {mergeMode ? `Gộp (${mergeTableIds.length})` : 'Gộp bàn'}
          </button>
          <button
            onClick={() => setSplitMode(!splitMode)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              splitMode ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            disabled={!selectedTable || selectedTable.status !== 'OCCUPIED'}
          >
            Tách bill
          </button>
          <div className="flex-1" />
          <div className="text-xs text-slate-400">
            {tables.filter(t => t.status === 'EMPTY').length} trống / {tables.length} tổng
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT PANEL: Table Detail / Order Info
          ═══════════════════════════════════════════════════════════════ */}
      <div className="w-96 min-w-[340px] border-l border-slate-200 flex flex-col bg-white">
        {selectedTable ? (
          <>
            {/* Table header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                    statusColor[selectedTable.status as TableStatus] || 'bg-slate-400'
                  }`}>
                    {selectedTable.name.slice(-2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedTable.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {selectedTable.capacity} chỗ · {statusLabel[selectedTable.status as TableStatus]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTable(null); setSession(null); setCartItems([]); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Đóng"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {session && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    Phiên #{session.id}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cartItems.length} món
                  </span>
                </div>
              )}
            </div>

            {/* QR Ordering section */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  <span className="text-xs font-medium text-slate-600">QR gọi món</span>
                </div>
                <button
                  disabled
                  className="px-3 py-1.5 text-[11px] font-medium bg-white border border-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
                >
                  Tạo QR
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {/* TODO: When QR ordering is implemented, show order URL here */}
                Khách hàng quét QR để tự gọi món — sắp ra mắt
              </p>
            </div>

            {/* Order items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-10 h-10 mx-auto text-slate-200 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6 2 11h20c0-5-4.48-9-10-9z"/><path d="M2 13h20v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1z"/></svg>
                  <div className="text-sm text-slate-400">Chưa có món</div>
                  <div className="text-xs text-slate-300 mt-1">Nhấn "Thêm món" để bắt đầu</div>
                </div>
              ) : (
                cartItems.map(item => (
                  <div
                    key={item.detailId}
                    className={`rounded-xl p-3 border transition-colors ${
                      item.status === 'COOKING' ? 'border-orange-200 bg-orange-50' :
                      item.status === 'READY' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">{item.productName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{item.variantName}</div>
                        <div className="text-[10px] mt-1">
                          {item.status === 'PENDING' && <span className="text-slate-400">⏳ Chờ xử lý</span>}
                          {item.status === 'COOKING' && <span className="text-orange-500">🔥 Đang nấu</span>}
                          {item.status === 'READY' && <span className="text-emerald-500">✅ Sẵn sàng</span>}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 ml-2 whitespace-nowrap">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.detailId, -1)}
                          disabled={cartLoading}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-sm text-slate-500 disabled:opacity-50 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-sm w-6 text-center text-slate-700 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.detailId, 1)}
                          disabled={cartLoading}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-sm text-slate-500 disabled:opacity-50 transition-colors"
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

            {/* Total & Action buttons */}
            <div className="border-t border-slate-200 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Tổng cộng</span>
                <span className="text-xl font-bold text-emerald-600">{total.toLocaleString('vi-VN')}đ</span>
              </div>
              <button
                onClick={() => setMenuOpen(true)}
                className="w-full py-2.5 bg-[#25439b] hover:bg-[#1c3580] rounded-xl text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Thêm món
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSendToKitchen}
                  disabled={!session || cartItems.length === 0 || cartLoading}
                  className="py-2.5 bg-orange-500 hover:bg-orange-400 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? '...' : '🔥 Gửi bếp'}
                </button>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={!session || cartItems.length === 0}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💳 Thanh toán
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No table selected — empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">Chọn bàn để bắt đầu</h3>
            <p className="text-sm text-slate-400 max-w-[200px]">
              Nhấn vào bàn trên sơ đồ để xem thông tin và bắt đầu đặt món
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-[180px]">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Trống — có thể chọn</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Đang dùng</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Đặt trước</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MENU MODAL — Opens when "Thêm món" is clicked
          ═══════════════════════════════════════════════════════════════ */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex">
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setMenuOpen(false)} />

          {/* Slide-in panel from right */}
          <div className="w-[520px] max-w-[90vw] bg-white shadow-2xl flex flex-col animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Thực đơn</h3>
                {selectedTable && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thêm món cho {selectedTable.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-3 overflow-x-auto border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === null ? 'bg-[#25439b] text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id ? 'bg-[#25439b] text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="text-slate-400 text-sm text-center mt-12">Không có sản phẩm</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
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
                              onClick={() => {
                                handleAddToCart(variant);
                              }}
                              disabled={!session || cartLoading}
                              className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center"
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CHECKOUT MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCheckoutOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
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

      {/* ═══════════════════════════════════════════════════════════════
          MANAGER MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {managerOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setManagerOpen(false); setEditingRoom(null); setEditingTable(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Quản lý bàn & phòng</h3>
              <button onClick={() => { setManagerOpen(false); setEditingRoom(null); setEditingTable(null); }} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
            </div>
            <div className="flex border-b border-slate-200">
              <button onClick={() => setManagerTab('rooms')} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${managerTab === 'rooms' ? 'border-b-2 border-[#25439b] text-[#25439b]' : 'text-slate-400 hover:text-slate-600'}`}>Phòng</button>
              <button onClick={() => setManagerTab('tables')} className={`flex-1 py-2.5 text-sm font-medium transition-colors ${managerTab === 'tables' ? 'border-b-2 border-[#25439b] text-[#25439b]' : 'text-slate-400 hover:text-slate-600'}`}>Bàn</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {managerTab === 'rooms' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="Tên phòng..." className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20" onKeyDown={e => e.key === 'Enter' && handleSaveRoom()} />
                    <button onClick={handleSaveRoom} className="px-4 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg text-sm transition-colors">{editingRoom ? 'Cập nhật' : 'Thêm'}</button>
                  </div>
                  <div className="space-y-1">
                    {rooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                        <span className="text-sm text-slate-700">{room.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingRoom(room); setRoomName(room.name); }} className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Sửa</button>
                          <button onClick={() => handleDeleteRoom(room.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Xóa</button>
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
                    <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Tên bàn..." className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20" />
                    <input type="number" value={tableCapacity} onChange={e => setTableCapacity(parseInt(e.target.value) || 1)} min={1} placeholder="Số chỗ" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20" />
                    <select value={tableRoomId} onChange={e => setTableRoomId(parseInt(e.target.value))} className="col-span-2 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20">
                      <option value={0}>-- Chọn phòng --</option>
                      {rooms.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveTable} className="flex-1 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg text-sm transition-colors">{editingTable ? 'Cập nhật' : 'Thêm bàn'}</button>
                    {editingTable && <button onClick={() => { setEditingTable(null); setTableName(''); setTableCapacity(4); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition-colors">Hủy</button>}
                  </div>
                  <div className="space-y-1 mt-2">
                    {tables.map(table => (
                      <div key={table.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group">
                        <div>
                          <span className="text-sm text-slate-700">{table.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">{table.capacity} chỗ · {table.room?.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingTable(table); setTableName(table.name); setTableCapacity(table.capacity); setTableRoomId(table.room?.id || 0); }} className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Sửa</button>
                          <button onClick={() => handleDeleteTable(table.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Xóa</button>
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

      {/* ═══════════════════════════════════════════════════════════════
          360 PANORAMA MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {panoramaOpen && selectedRoomObj?.panoramaUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setPanoramaOpen(false)}>
          <button onClick={() => setPanoramaOpen(false)} className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-slate-300">✕</button>
          {selectedRoomObj.panoramaType === 'EXTERNAL_LINK' ? (
            <div className="text-center" onClick={e => e.stopPropagation()}>
              <iframe src={selectedRoomObj.panoramaUrl} className="w-[90vw] h-[80vh] rounded-lg border-0 bg-slate-900" title="360 View" />
              <button onClick={() => window.open(selectedRoomObj.panoramaUrl!, '_blank')} className="mt-3 px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">Mở trong tab mới</button>
            </div>
          ) : (
            <img src={selectedRoomObj.panoramaUrl} alt="360 panorama" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          )}
          <div className="absolute bottom-4 text-white/70 text-xs">{selectedRoomObj.name} — 360 View</div>
        </div>
      )}

      {/* Slide-in animation */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
