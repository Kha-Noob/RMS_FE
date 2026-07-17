'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { api, getApiErrorMessage, connectWebSocket } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import FloorPlanBackground from '@/components/FloorPlanBackground';
import ObjectRenderer from '@/components/layout-builder/ObjectRenderer';
import { getObjectDefinition } from '@/components/object-registry';
import { getActiveMenuItems } from '@/lib/menu-store';
import type { TableEntity, Room, Product, ProductVariant, Category, CartItem, TableSession, FloorPlanObject } from '@/types';
import { getTableStyleLabel } from '@/types';

const PannellumViewer = dynamic(() => import('@/components/PannellumViewer'), { ssr: false });

function asJsonObject(value: FloorPlanObject['metadataJson']): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return value;
}

interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: Category;
}

// ─── Convert menu-store items to POS ProductWithVariants ────────────────────
function menuToProducts(items: { id: number; name: string; description: string; priceVnd: number; imageUrl: string | null; category: { id: number; name: string } | null; variants: { id: number; name: string; priceVnd: number }[]; status: string }[]): ProductWithVariants[] {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    isActive: item.status === 'ACTIVE',
    category: item.category ?? { id: 0, name: 'Chưa phân loại' },
    variants: item.variants.length > 0
      ? item.variants.map(v => ({
          id: v.id,
          name: v.name,
          price: v.priceVnd,
          product: { id: item.id, name: item.name, description: item.description, isActive: item.status === 'ACTIVE' },
        }))
      : [{
          id: item.id,
          name: item.name,
          price: item.priceVnd,
          product: { id: item.id, name: item.name, description: item.description, isActive: item.status === 'ACTIVE' },
        }],
  }));
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

function getSessionDuration(openedAt: string | null | undefined): string {
  if (!openedAt) return '';
  const diff = Date.now() - new Date(openedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa vào';
  if (mins < 60) return `${mins}p`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}p`;
}

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
  const [tableStyle, setTableStyle] = useState<'ROUND' | 'SQUARE' | 'RECTANGLE' | 'VIP'>('ROUND');

  const [mergeMode, setMergeMode] = useState(false);
  const [mergeTableIds, setMergeTableIds] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState(false);

  const [panoramaOpen, setPanoramaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // AddItemModal state
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addItemProduct, setAddItemProduct] = useState<ProductWithVariants | null>(null);
  const [addItemVariant, setAddItemVariant] = useState<ProductVariant | null>(null);
  const [addItemSize, setAddItemSize] = useState<{ id: number; name: string; price: number } | null>(null);
  const [addItemQuantity, setAddItemQuantity] = useState(1);
  const [addItemNote, setAddItemNote] = useState('');

  const [activeFloorPlan, setActiveFloorPlan] = useState<{ id: number; name: string; width: number; height: number; backgroundMode: string; floorDiagramImageUrl: string | null; floorDiagramFitMode?: 'contain' | 'cover' | 'fill' | null; floorDiagramX?: number | null; floorDiagramY?: number | null; floorDiagramWidth?: number | null; floorDiagramHeight?: number | null; floorDiagramScale?: number | null; floorDiagramRotation?: number | null; panoramaUrl: string | null; panoramaType: string | null } | null>(null);
  const [floorPlanObjects, setFloorPlanObjects] = useState<FloorPlanObject[]>([]);
  const [floorPlanLoading, setFloorPlanLoading] = useState(false);

  const mountedRef = useRef(true);
  const loadIdRef = useRef(0);
  const floorPlanLoadIdRef = useRef(0);

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
        const activeProducts = productsResult.value.filter(p => p.isActive);
        productsOk = true;

        // Merge backend POS products with menu API items
        try {
          const menuItems = await getActiveMenuItems();
          const menuProducts = menuToProducts(menuItems);
          const mergedWithBackend = menuProducts.map(mp => {
            const bp = activeProducts.find(p => p.id === mp.id || p.name.toLowerCase() === mp.name.toLowerCase());
            if (bp && bp.variants && bp.variants.length > 0) {
              return {
                ...mp,
                variants: bp.variants,
              };
            }
            return mp;
          });
          const menuIds = new Set(mergedWithBackend.map(p => p.id));
          const backendOnly = activeProducts.filter(p => !menuIds.has(p.id));
          const merged = [...mergedWithBackend, ...backendOnly];
          setProducts(merged);
          const catSet = new Map<number, Category>();
          merged.forEach(p => { if (p.category) catSet.set(p.category.id, p.category); });
          setCategories(Array.from(catSet.values()));
        } catch {
          setProducts(activeProducts);
          const catSet = new Map<number, Category>();
          activeProducts.forEach(p => { if (p.category) catSet.set(p.category.id, p.category); });
          setCategories(Array.from(catSet.values()));
        }
      } else {
        // Backend failed — load from menu API only
        try {
          const menuItems = await getActiveMenuItems();
          const menuProducts = menuToProducts(menuItems);
          if (menuProducts.length > 0) {
            setProducts(menuProducts);
            productsOk = true;
            const catSet = new Map<number, Category>();
            menuProducts.forEach(p => { if (p.category) catSet.set(p.category.id, p.category); });
            setCategories(Array.from(catSet.values()));
          }
        } catch { /* menu API also unavailable */ }
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

  // Refresh products when menu drawer opens (merge, don't overwrite)
  useEffect(() => {
    if (!menuOpen) return;
    let cancelled = false;
    getActiveMenuItems().then(menuItems => {
      if (cancelled) return;
      const menuProducts = menuToProducts(menuItems);
      setProducts(prev => {
        const mergedWithBackend = menuProducts.map(mp => {
          const bp = prev.find(p => p.id === mp.id || p.name.toLowerCase() === mp.name.toLowerCase());
          if (bp && bp.variants && bp.variants.length > 0) {
            return {
              ...mp,
              variants: bp.variants,
            };
          }
          return mp;
        });
        const menuIds = new Set(mergedWithBackend.map(p => p.id));
        const existing = prev.filter(p => !menuIds.has(p.id));
        return [...mergedWithBackend, ...existing];
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [menuOpen]);

  // Load published floor plan for selected room
  const loadFloorPlanForRoom = useCallback(async (roomId: number) => {
    const thisLoad = ++floorPlanLoadIdRef.current;
    setFloorPlanLoading(true);
    setActiveFloorPlan(null);
    setFloorPlanObjects([]);
    try {
      const res = await api.get<{ floorPlan: { id: number; name: string; width: number; height: number; backgroundMode: string; floorDiagramImageUrl: string | null; floorDiagramFitMode?: 'contain' | 'cover' | 'fill' | null; floorDiagramX?: number | null; floorDiagramY?: number | null; floorDiagramWidth?: number | null; floorDiagramHeight?: number | null; floorDiagramScale?: number | null; floorDiagramRotation?: number | null; panoramaUrl: string | null; panoramaType: string | null } | null; objects: FloorPlanObject[] } | null>(
        '/api/pos/floor-plans/active', { params: { roomId } }
      );
      if (!mountedRef.current || thisLoad !== floorPlanLoadIdRef.current) return;
      if (res?.floorPlan) {
        setActiveFloorPlan(res.floorPlan);
        setFloorPlanObjects(res.objects || []);
      } else {
        setActiveFloorPlan(null);
        setFloorPlanObjects([]);
      }
    } catch {
      if (!mountedRef.current || thisLoad !== floorPlanLoadIdRef.current) return;
      setActiveFloorPlan(null);
      setFloorPlanObjects([]);
    } finally {
      if (mountedRef.current && thisLoad === floorPlanLoadIdRef.current) {
        setFloorPlanLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadFloorPlanForRoom(selectedRoom);
    } else {
      floorPlanLoadIdRef.current += 1;
      setFloorPlanLoading(false);
      setActiveFloorPlan(null);
      setFloorPlanObjects([]);
    }
  }, [selectedRoom, loadFloorPlanForRoom]);


  const filteredTables = selectedRoom !== null
    ? tables.filter(t => t.room?.id === selectedRoom)
    : tables;

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === null || p.category?.id === selectedCategory;
    const matchesSearch = menuSearchQuery.trim() === '' || 
      p.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const resetTableForm = useCallback(() => {
    setEditingTable(null);
    setTableName('');
    setTableCapacity(4);
    setTableRoomId(0);
    setTableStyle('ROUND');
  }, []);

  const resetRoomForm = useCallback(() => {
    setEditingRoom(null);
    setRoomName('');
  }, []);

  const showRequestError = useCallback((error: unknown, fallback: string) => {
    console.error(fallback, error);
    toast.error(getApiErrorMessage(error, fallback));
  }, []);

  const ensureSession = async (table: TableEntity): Promise<TableSession> => {
    try {
      if (table.status === 'EMPTY') {
        const res = await api.post<TableSession>('/api/pos/session/open', null, { params: { tableId: table.id } });
        await loadData();
        return res;
      }
      const res = await api.get<ActiveSessionResponse>('/api/pos/session/active', { params: { tableId: table.id } });
      return {
        id: res.sessionId,
        table: table,
        status: res.status,
      };
    } catch {
      // Backend offline or error - open fallback session locally
      return {
        id: Date.now(),
        table,
        status: 'ACTIVE'
      };
    }
  };

  const loadSession = useCallback(async (table: TableEntity) => {
    if (table.status === 'EMPTY') {
      setSession({ id: Date.now(), table, status: 'ACTIVE' });
      setCartItems([]);
      return;
    }
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
      // Backend unavailable — create a local session so POS can still work
      setSession({ id: Date.now(), table, status: 'ACTIVE' });
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

  // Real-time synchronization of rooms, tables and session states using WebSockets
  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    
    function connect() {
      if (!active) return;
      ws = connectWebSocket('/ws/kds');
      
      ws.onmessage = (event) => {
        const text = event.data;
        if (text === 'ORDER_STATE_CHANGED' || text === 'NEW_ORDER_SUBMITTED' || text.includes('KDS_READY_ALERT')) {
          loadData();
          if (selectedTable) {
            loadSession(selectedTable);
          }
        }
      };
      
      ws.onclose = () => {
        if (active) {
          setTimeout(connect, 3000);
        }
      };
    }
    
    connect();
    return () => {
      active = false;
      if (ws) ws.close();
    };
  }, [loadData, selectedTable, loadSession]);

  const handleAddToCart = async (product: ProductWithVariants, variant: ProductVariant | null, size: { id: number; name: string; price: number } | null, quantity: number, note: string) => {
    if (!selectedTable) {
      toast.warning('Chọn bàn trước khi thêm món');
      return;
    }
    const itemPrice = size ? size.price : (variant?.price ?? 0);
    const variantName = variant ? variant.name : product.name;
    const sizeName = size ? size.name : '';
    setCartLoading(true);
    try {
      let currentSession = session;
      if (!currentSession || currentSession.id > 1000000000000) {
        currentSession = await ensureSession(selectedTable);
        setSession(currentSession);
      }

      await api.postForm('/api/pos/order/add', {
        sessionId: currentSession.id,
        menuItemId: product.id,
        variantId: variant?.id ?? '',
        sizeId: size?.id ?? '',
        quantity,
        note,
      });
      await loadSession(selectedTable);
      toast.success(`Đã thêm ${variantName}${sizeName ? ' - ' + sizeName : ''}`);
    } catch {
      // Backend unavailable — add locally to cart
      setCartItems(prev => {
        const existing = prev.find(i =>
          i.productName === product.name &&
          i.variantName === variantName &&
          i.sizeName === sizeName &&
          i.notes === note
        );
        if (existing) {
          return prev.map(i => i.detailId === existing.detailId ? { ...i, quantity: i.quantity + quantity } : i);
        }
        const newDetailId = prev.length > 0 ? Math.max(...prev.map(i => i.detailId)) + 1 : 1;
        return [...prev, {
          detailId: newDetailId,
          productName: product.name,
          variantName,
          sizeName,
          price: itemPrice,
          quantity,
          status: 'PENDING',
          notes: note,
        }];
      });
      toast.success(`Đã thêm ${variantName}${sizeName ? ' - ' + sizeName : ''}`);
    } finally {
      setCartLoading(false);
    }
  };

  const openAddItemModal = (product: ProductWithVariants, variant: ProductVariant | null = null) => {
    setAddItemProduct(product);
    setAddItemVariant(variant);
    setAddItemSize(null);
    setAddItemQuantity(1);
    setAddItemNote('');
    setAddItemOpen(true);
  };

  const closeAddItemModal = () => {
    setAddItemOpen(false);
    setAddItemProduct(null);
    setAddItemVariant(null);
    setAddItemSize(null);
    setAddItemQuantity(1);
    setAddItemNote('');
  };

  const handleAddItemConfirm = () => {
    if (!addItemProduct) return;
    handleAddToCart(addItemProduct, addItemVariant, addItemSize, addItemQuantity, addItemNote);
    closeAddItemModal();
  };

  const addItemPrice = addItemSize ? addItemSize.price : (addItemVariant?.price ?? addItemProduct?.variants[0]?.price ?? 0);
  const addItemTotal = addItemPrice * addItemQuantity;
  const addItemNeedsVariant = addItemProduct && addItemProduct.variants.length > 1 && !addItemVariant;
  const addItemCanConfirm = addItemProduct && !addItemNeedsVariant;

  const handleUpdateQuantity = async (detailId: number, delta: number) => {
    if (!session || !selectedTable) return;
    setCartLoading(true);
    try {
      let currentSession = session;
      if (currentSession.id > 1000000000000) {
        currentSession = await ensureSession(selectedTable);
        setSession(currentSession);
      }
      const item = cartItems.find(i => i.detailId === detailId);
      if (!item) return;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        await api.delete(`/api/pos/session/${currentSession.id}/item/${detailId}`);
      } else {
        await api.put(`/api/pos/session/${currentSession.id}/item/${detailId}`, null, {
          params: { quantity: newQty },
        });
      }
      await loadSession(selectedTable);
    } catch {
      // Backend unavailable — update locally
      setCartItems(prev => {
        const item = prev.find(i => i.detailId === detailId);
        if (!item) return prev;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return prev.filter(i => i.detailId !== detailId);
        return prev.map(i => i.detailId === detailId ? { ...i, quantity: newQty } : i);
      });
    } finally {
      setCartLoading(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (!session || !selectedTable) return;
    setCartLoading(true);
    try {
      let currentSession = session;
      if (currentSession.id > 1000000000000) {
        currentSession = await ensureSession(selectedTable);
        setSession(currentSession);
      }

      // Synchronize any local pending cart items to database first
      for (const item of cartItems) {
        if (item.status === 'PENDING') {
          const p = products.find(prod => prod.name === item.productName);
          if (p) {
            const v = p.variants.find(varnt => varnt.name === item.variantName);
            await api.postForm('/api/pos/order/add', {
              sessionId: currentSession.id,
              menuItemId: p.id,
              variantId: v?.id ?? '',
              sizeId: '',
              quantity: item.quantity,
              note: item.notes,
            });
          }
        }
      }

      await api.postForm('/api/pos/order/send', { sessionId: currentSession.id });
      await loadSession(selectedTable);
      await loadData();
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

  const refreshRoomsTablesAndFloorPlan = useCallback(async () => {
    if (!activeBranchId) return;
    const [roomRes, tableRes] = await Promise.all([
      api.get<Room[]>('/api/pos/rooms', { params: { branchId: activeBranchId } }),
      api.get<TableEntity[]>('/api/pos/tables', { params: { branchId: activeBranchId } }),
    ]);
    setRooms(roomRes);
    setTables(tableRes);
    if (selectedRoom) {
      await loadFloorPlanForRoom(selectedRoom);
    }
  }, [activeBranchId, selectedRoom, loadFloorPlanForRoom]);

  const handleSaveRoom = async () => {
    const normalizedName = roomName.trim();
    if (!normalizedName) {
      toast.warning('Tên phòng là bắt buộc.');
      return;
    }
    const duplicate = rooms.some(room =>
      room.name.trim().toLowerCase() === normalizedName.toLowerCase() && room.id !== editingRoom?.id
    );
    if (duplicate) {
      toast.warning('Tên phòng đã tồn tại trong chi nhánh này.');
      return;
    }
    try {
      if (editingRoom) {
        await api.postForm('/api/pos/rooms/update', {
          roomId: editingRoom.id,
          name: normalizedName,
        });
        toast.success('Cập nhật phòng thành công');
      } else {
        await api.postForm('/api/pos/rooms/add', {
          name: normalizedName,
        });
        toast.success('Thêm phòng thành công');
      }
      resetRoomForm();
      await refreshRoomsTablesAndFloorPlan();
    } catch (error) {
      showRequestError(error, 'Lưu phòng thất bại');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!confirm('Xóa phòng này?')) return;
    try {
      await api.postForm('/api/pos/rooms/delete', { roomId: id });
      toast.success('Xóa phòng thành công');
      if (selectedRoom === id) setSelectedRoom(null);
      if (editingRoom?.id === id) resetRoomForm();
      await refreshRoomsTablesAndFloorPlan();
    } catch (error) {
      showRequestError(error, 'Xóa phòng thất bại');
    }
  };

  const tableStyleFromTable = (table: TableEntity): typeof tableStyle => {
    if (table.tableStyle) return table.tableStyle;
    return table.shape === 'rectangle' ? 'RECTANGLE' : 'ROUND';
  };

  const beginEditTable = (table: TableEntity) => {
    setEditingTable(table);
    setTableName(table.name);
    setTableCapacity(Math.max(1, table.capacity || 1));
    setTableRoomId(table.room?.id || 0);
    setTableStyle(tableStyleFromTable(table));
  };

  const handleSaveTable = async () => {
    const normalizedName = tableName.trim();
    if (!normalizedName) {
      toast.warning('Tên bàn là bắt buộc.');
      return;
    }
    if (!tableRoomId) {
      toast.warning('Chọn phòng cho bàn');
      return;
    }
    if (!tableStyle) {
      toast.warning('Chọn kiểu bàn');
      return;
    }
    if (tableCapacity < 1) {
      toast.warning('Sức chứa phải lớn hơn hoặc bằng 1.');
      return;
    }
    const duplicate = tables.some(table =>
      table.room?.id === tableRoomId &&
      table.name.trim().toLowerCase() === normalizedName.toLowerCase() &&
      table.id !== editingTable?.id
    );
    if (duplicate) {
      toast.warning('Tên bàn đã tồn tại trong phòng này.');
      return;
    }
    try {
      if (editingTable) {
        await api.postForm('/api/pos/tables/update', {
          tableId: editingTable.id,
          name: normalizedName,
          capacity: tableCapacity,
          roomId: tableRoomId,
          tableStyle,
        });
        toast.success('Cập nhật bàn thành công');
      } else {
        await api.postForm('/api/pos/tables/add', {
          name: normalizedName,
          capacity: tableCapacity,
          roomId: tableRoomId,
          tableStyle,
        });
        toast.success('Thêm bàn thành công');
      }
      resetTableForm();
      await refreshRoomsTablesAndFloorPlan();
    } catch (error) {
      showRequestError(error, 'Lưu bàn thất bại');
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm('Xóa bàn này?')) return;
    try {
      await api.postForm('/api/pos/tables/delete', { tableId: id });
      toast.success('Xóa bàn thành công');
      if (selectedTable?.id === id) {
        setSelectedTable(null);
        setSession(null);
        setCartItems([]);
      }
      if (editingTable?.id === id) resetTableForm();
      await refreshRoomsTablesAndFloorPlan();
    } catch (error) {
      showRequestError(error, 'Xóa bàn thất bại');
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
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MAIN AREA: Floor Plan / Table Map (takes up most of the screen)
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
            {activeFloorPlan?.panoramaUrl && (
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
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
              <svg className="w-12 h-12 mb-3 text-slate-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              <div className="text-sm font-medium">Không có bàn nào</div>
              {selectedRoom && <div className="text-xs mt-1 opacity-70">Thử chọn khu vực hoặc phòng khác</div>}
            </div>
          ) : (
            /* Beautiful Redesigned Table Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredTables.map(table => {
                const isSelected = selectedTable?.id === table.id;
                const isMergeSelected = mergeTableIds.includes(table.id);
                
                // Determine table design status styles
                let statusBg = '';
                let statusText = '';
                let statusBorder = '';
                let dotColor = '';
                
                switch (table.status) {
                  case 'EMPTY':
                    statusBg = 'bg-emerald-50/60 hover:bg-emerald-50/80';
                    statusText = 'text-emerald-700';
                    statusBorder = 'border-emerald-200/80';
                    dotColor = 'bg-emerald-500';
                    break;
                  case 'OCCUPIED':
                    statusBg = 'bg-rose-50/60 hover:bg-rose-50/80';
                    statusText = 'text-rose-700';
                    statusBorder = 'border-rose-200/80';
                    dotColor = 'bg-rose-500';
                    break;
                  case 'RESERVED':
                    statusBg = 'bg-amber-50/60 hover:bg-amber-50/80';
                    statusText = 'text-amber-700';
                    statusBorder = 'border-amber-200/80';
                    dotColor = 'bg-amber-500';
                    break;
                  default:
                    statusBg = 'bg-slate-50/60 hover:bg-slate-50/80';
                    statusText = 'text-slate-700';
                    statusBorder = 'border-slate-200/80';
                    dotColor = 'bg-slate-500';
                }
                
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
                    className={`relative p-5 rounded-2xl border text-left transition-all ${statusBg} ${statusBorder} ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 border-indigo-300 shadow-md scale-[1.03]'
                        : isMergeSelected
                        ? 'ring-2 ring-purple-600 border-purple-300 shadow-md scale-[1.03]'
                        : 'hover:shadow-sm hover:scale-[1.01]'
                    }`}
                  >
                    {/* Header: Table Name and Dot status indicator */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                        {table.name}
                      </span>
                      <span className="flex h-2 w-2 relative">
                        {table.status === 'OCCUPIED' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
                      </span>
                    </div>
                    
                    {/* Body Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-60 text-slate-500">Ghế:</span>
                        <span className="text-xs font-semibold text-slate-700">{table.capacity} chỗ</span>
                      </div>
                      {selectedRoom === null && table.room?.name && (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] uppercase font-bold tracking-wider opacity-60 text-slate-500">Phòng:</span>
                          <span className="text-xs font-semibold text-slate-700 truncate">{table.room.name}</span>
                        </div>
                      )}
                      {table.status === 'OCCUPIED' && table.sessionOpenedAt && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1">
                          <span className="opacity-60 text-[9px] uppercase font-bold tracking-wider">Mở:</span>
                          <span>{getSessionDuration(table.sessionOpenedAt)}</span>
                        </div>
                      )}
                      {table.status === 'OCCUPIED' && table.sessionTotalAmount !== undefined && table.sessionTotalAmount !== null && table.sessionTotalAmount > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-0.5">
                          <span className="opacity-60 text-[9px] uppercase font-bold tracking-wider">Tạm tính:</span>
                          <span>{table.sessionTotalAmount.toLocaleString('vi-VN')}đ</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/50">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider opacity-70 text-slate-400">Trạng thái</span>
                        <span className={`text-[10px] font-black ${statusText}`}>
                          {statusLabel[table.status as TableStatus] || table.status}
                        </span>
                      </div>
                    </div>
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          RIGHT PANEL: Table Detail / Order Info
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
                  <span className="text-xs font-medium text-slate-600">QR gửi món</span>
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
                Khách hàng quét QR để tự gửi món - sắp ra mắt
              </p>
            </div>

            {/* Order items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-10 h-10 mx-auto text-slate-200 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2C6.48 2 2 6 2 11h20c0-5-4.48-9-10-9z"/><path d="M2 13h20v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1z"/></svg>
                  <div className="text-sm text-slate-400">Chưa có món</div>
                  <div className="text-xs text-slate-300 mt-1">Nhấn &quot;Thêm món&quot; để bắt đầu</div>
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
                        {item.variantName && item.variantName !== item.productName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">Loại: {item.variantName}</div>
                        )}
                        {item.sizeName && (
                          <div className="text-[11px] text-slate-500 mt-0.5">Size: {item.sizeName}</div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] text-amber-600 mt-0.5 italic">Ghi chú: {item.notes}</div>
                        )}
                        <div className="text-[10px] mt-1">
                          {item.status === 'PENDING' && <span className="text-slate-400">Đang chờ xử lý</span>}
                          {item.status === 'COOKING' && <span className="text-orange-500">Đang nấu</span>}
                          {item.status === 'READY' && <span className="text-emerald-500">Sẵn sàng</span>}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 ml-2 whitespace-nowrap">
                        {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.detailId, -1)}
                          disabled={cartLoading}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-sm text-slate-500 disabled:opacity-50 transition-colors"
                        >
                          -
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
                  {cartLoading ? '...' : 'Gửi bếp'}
                </button>
                <button
                  onClick={() => setCheckoutOpen(true)}
                  disabled={!session || cartItems.length === 0}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thanh toán
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No table selected - empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">Chọn bàn để bắt đầu</h3>
            <p className="text-sm text-slate-400 max-w-[200px]">
              Nhấn vào bàn tròn số để xem thông tin và bắt đầu đặt món
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-[180px]">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Trống có thể chọn</span>
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
          MENU MODAL - Opens when "Thêm món" is clicked
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

            {/* Search Bar */}
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/50">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={menuSearchQuery}
                  onChange={e => setMenuSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#25439b]/35 focus:border-[#25439b]/50"
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                {menuSearchQuery && (
                  <button
                    onClick={() => setMenuSearchQuery('')}
                    className="absolute right-3 top-2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>
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
              {loading ? (
                <div className="text-slate-400 text-sm text-center mt-12 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
                  Đang tải thực đơn...
                </div>
              ) : filteredProducts.length === 0 ? (
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
                      {product.variants.length > 0 ? (
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {product.variants.map((variant, vIdx) => (
                            <button
                              key={`${product.id}-v${vIdx}`}
                              onClick={() => openAddItemModal(product, variant)}
                              disabled={!session || cartLoading}
                              className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center cursor-pointer"
                            >
                              <span className="text-xs text-slate-600 truncate mr-2">{variant.name}</span>
                              <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
                                {variant.price.toLocaleString('vi-VN')}đ
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => openAddItemModal(product)}
                          disabled={!session || cartLoading}
                          className="w-full px-3 py-2.5 border-t border-slate-100 text-left hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center cursor-pointer"
                        >
                          <span className="text-xs text-slate-600 truncate mr-2">Thêm vào bàn</span>
                          <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
                            {(product.variants[0]?.price ?? 0).toLocaleString('vi-VN')}đ
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {addItemOpen && addItemProduct && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={closeAddItemModal}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">{addItemProduct.name}</h3>
              <button onClick={closeAddItemModal} className="text-slate-400 hover:text-slate-600 text-xl">&#10005;</button>
            </div>
            <div className="p-4 space-y-4">
              {addItemProduct.variants.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Ch&#7885;n lo&#7841;i *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {addItemProduct.variants.map((v, idx) => (
                      <button key={`sv-${addItemProduct.id}-${idx}`} type="button" onClick={() => { setAddItemVariant(v); setAddItemSize(null); }}
                        className={`p-2.5 rounded-lg border text-left transition-all text-sm ${addItemVariant?.id === v.id ? 'border-[#25439b] bg-[#25439b]/5 ring-1 ring-[#25439b]/20' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="font-medium text-slate-800">{v.name}</div>
                        <div className="text-xs text-emerald-600 font-semibold">{v.price.toLocaleString('vi-VN')}&#8363;</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {addItemProduct.variants.length <= 1 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Ch&#7885;n size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: 1, name: 'Nh&#7887;', price: addItemPrice }, { id: 2, name: 'V&#7915;a', price: Math.round(addItemPrice * 1.2) }, { id: 3, name: 'L&#7899;n', price: Math.round(addItemPrice * 1.5) }].map(s => (
                      <button key={s.id} type="button" onClick={() => setAddItemSize(addItemSize?.id === s.id ? null : s)}
                        className={`p-2 rounded-lg border text-center transition-all text-sm ${addItemSize?.id === s.id ? 'border-[#25439b] bg-[#25439b]/5 ring-1 ring-[#25439b]/20' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className="font-medium text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.price.toLocaleString('vi-VN')}&#8363;</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">S&#7889; l&#432;&#7907;ng</label>
                <div className="flex items-center justify-center gap-4">
                  <button type="button" onClick={() => setAddItemQuantity(Math.max(1, addItemQuantity - 1))} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 transition-colors">&#8722;</button>
                  <span className="text-xl font-bold text-slate-800 w-8 text-center">{addItemQuantity}</span>
                  <button type="button" onClick={() => setAddItemQuantity(addItemQuantity + 1)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">Ghi ch&#432;</label>
                <input type="text" value={addItemNote} onChange={e => setAddItemNote(e.target.value)} placeholder="&#205;t h&#224;nh, th&#234;m s&#7885;t..." className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#25439b]" />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-500">Th&#224;nh ti&#7873;n</span>
                <span className="text-lg font-bold text-emerald-600">{addItemTotal.toLocaleString('vi-VN')}&#8363;</span>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-200">
              <button onClick={closeAddItemModal} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">H&#7911;y</button>
              <button onClick={handleAddItemConfirm} disabled={!addItemCanConfirm || cartLoading} className="flex-1 py-2.5 rounded-xl bg-[#25439b] hover:bg-[#1c3580] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {cartLoading ? '&#272;ang th&#234;m...' : 'Th&#234;m v&#224;o b&#7843;n'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCheckoutOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Thanh toán</h3>
              <button onClick={() => setCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">âœ•</button>
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
                    { key: 'CASH' as const, label: 'Tiền mặt', desc: 'Thanh toán bằng tiền mặt' },
                    { key: 'BANK_TRANSFER' as const, label: 'Chuyển khoản / VietQR', desc: 'Chuyển khoản ngân hàng' },
                    { key: 'VNPAY' as const, label: 'VNPay QR', desc: 'Quét mã QR VNPay' },
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MANAGER MODAL
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {managerOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setManagerOpen(false); resetRoomForm(); resetTableForm(); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Quản lý bàn & phòng</h3>
              <button onClick={() => { setManagerOpen(false); resetRoomForm(); resetTableForm(); }} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">âœ•</button>
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
                          <button onClick={(e) => { e.stopPropagation(); setEditingRoom(room); setRoomName(room.name); }} className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Sửa</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Xóa</button>
                        </div>
                      </div>
                    ))}
                    {rooms.length === 0 && <div className="text-slate-400 text-sm text-center py-4">Chưa có phòng</div>}
                  </div>
                </div>
              )}
              {managerTab === 'tables' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <input type="text" value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Tên bàn..." className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20" />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-500 mb-0.5 block font-medium">Sức chứa</label>
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-[#25439b] focus-within:ring-1 focus-within:ring-[#25439b]/20">
                          <button type="button" onClick={() => setTableCapacity(c => Math.max(1, c - 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-100 transition-colors text-lg font-medium">-</button>
                          <input type="number" value={tableCapacity} onChange={e => setTableCapacity(Math.max(1, parseInt(e.target.value) || 1))} min={1} className="flex-1 text-center bg-white text-sm text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <span className="text-xs text-slate-400 px-1">khách</span>
                          <button type="button" onClick={() => setTableCapacity(c => c + 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-100 transition-colors text-lg font-medium">+</button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] text-slate-500 mb-0.5 block font-medium">Kiểu bàn</label>
                        <select value={tableStyle} onChange={e => setTableStyle(e.target.value as typeof tableStyle)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20">
                          <option value="ROUND">Bàn tròn</option>
                          <option value="SQUARE">Bàn vuông</option>
                          <option value="RECTANGLE">Bàn chữ nhật</option>
                          <option value="VIP">VIP Booth</option>
                        </select>
                      </div>
                    </div>
                    <select value={tableRoomId} onChange={e => setTableRoomId(parseInt(e.target.value))} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20">
                      <option value={0}>-- Chọn phòng --</option>
                      {rooms.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveTable} className="flex-1 py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg text-sm transition-colors">{editingTable ? 'Cập nhật bàn' : 'Thêm bàn'}</button>
                    {editingTable && <button onClick={resetTableForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm transition-colors">Hủy</button>}
                  </div>
                  <div className="space-y-1 mt-2">
                    {tables.map(table => (
                      <div key={table.id} onClick={() => beginEditTable(table)} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg group cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-700 font-medium">{table.name}</div>
                          <div className="text-[11px] text-slate-400">{table.capacity} khách · {getTableStyleLabel(table.tableStyle)} · {table.room?.name}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); beginEditTable(table); }} className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300">Sửa</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTable(table.id); }} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Xóa</button>
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

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          360 PANORAMA MODAL - Uses Pannellum for real 360 viewing
          â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {panoramaOpen && activeFloorPlan?.panoramaUrl && (() => {
        const pUrl = activeFloorPlan.panoramaUrl;
        const pType = activeFloorPlan.panoramaType;
        const pName = activeFloorPlan.name;
        return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setPanoramaOpen(false)}>
          <button onClick={() => setPanoramaOpen(false)} className="absolute top-4 right-4 text-white text-2xl z-10 hover:text-slate-300 bg-white/10 w-10 h-10 rounded-full flex items-center justify-center">âœ•</button>
          <div className="w-[95vw] h-[90vh] rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {pType === 'EXTERNAL_LINK' ? (
              <div className="w-full h-full flex flex-col">
                <iframe src={pUrl} className="w-full flex-1 rounded-xl border-0 bg-slate-900" title="360 View" />
                <button onClick={() => window.open(pUrl, '_blank')} className="mt-2 px-4 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30">Mở trong tab mới</button>
              </div>
            ) : (
              <PannellumViewer imageUrl={pUrl} className="w-full h-full rounded-xl" />
            )}
          </div>
          <div className="absolute bottom-4 text-white/70 text-xs">{pName} · 360° Panorama</div>
        </div>
        );
      })()}

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
