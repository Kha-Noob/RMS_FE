'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/Toast';
import type { TableEntity, Room } from '@/types';

export default function FloorPlansPage() {
  const { activeBranchId } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  const [floorUrl, setFloorUrl] = useState('');
  const [panoramaUrl, setPanoramaUrl] = useState('');
  const [panoramaType, setPanoramaType] = useState<string>('IMAGE_360');
  const [floorWidth, setFloorWidth] = useState('');
  const [floorHeight, setFloorHeight] = useState('');

  const [tableEdits, setTableEdits] = useState<Record<number, {
    layoutX: number;
    layoutY: number;
    layoutRadius: number;
    layoutRotation: number;
    displayLabel: string;
    capacity: number;
  }>>({});

  const [dragging, setDragging] = useState<number | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const loadRooms = useCallback(async () => {
    if (!activeBranchId) return;
    try {
      const res = await api.get<Room[]>('/api/pos/rooms', { params: { branchId: activeBranchId } });
      setRooms(res);
      if (res.length > 0 && selectedRoomId === null) {
        setSelectedRoomId(res[0].id);
      }
    } catch {
      toast.error('Không tải được danh sách phòng');
    }
  }, [activeBranchId, selectedRoomId]);

  const loadTables = useCallback(async (roomId: number) => {
    try {
      const res = await api.get<TableEntity[]>(`/api/floor-plans/rooms/${roomId}/tables`);
      setTables(res);

      const edits: typeof tableEdits = {};
      res.forEach(t => {
        edits[t.id] = {
          layoutX: t.layoutX ?? 50,
          layoutY: t.layoutY ?? 50,
          layoutRadius: t.layoutRadius ?? 25,
          layoutRotation: t.layoutRotation ?? 0,
          displayLabel: t.displayLabel ?? '',
          capacity: t.capacity ?? 4,
        };
      });
      setTableEdits(edits);
    } catch {
      toast.error('Không tải được danh sách bàn');
    }
  }, []);

  useEffect(() => {
    if (!activeBranchId) { setLoading(false); return; }
    setLoading(true);
    loadRooms().finally(() => setLoading(false));
  }, [activeBranchId, loadRooms]);

  useEffect(() => {
    if (selectedRoomId) {
      loadTables(selectedRoomId);
      const room = rooms.find(r => r.id === selectedRoomId);
      if (room) {
        setFloorUrl(room.floorPlanImageUrl || '');
        setPanoramaUrl(room.panoramaUrl || '');
        setPanoramaType(room.panoramaType || 'IMAGE_360');
        setFloorWidth(room.floorPlanWidth?.toString() || '');
        setFloorHeight(room.floorPlanHeight?.toString() || '');
      }
    }
  }, [selectedRoomId, rooms, loadTables]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await api.uploadFile<{ url: string }>('/api/floor-plans/upload', file);
      setFloorUrl(res.url);
      toast.success('Upload thành công');
    } catch {
      toast.error('Upload thất bại');
    }
    e.target.value = '';
  };

  const handleSaveRoomConfig = async () => {
    if (!selectedRoomId) return;
    setSaving(true);
    try {
      await api.postForm('/api/floor-plans/rooms/update', {
        roomId: selectedRoomId,
        floorPlanImageUrl: floorUrl || undefined,
        floorPlanWidth: floorWidth || undefined,
        floorPlanHeight: floorHeight || undefined,
        panoramaUrl: panoramaUrl || undefined,
        panoramaType: panoramaType || undefined,
      });
      toast.success('Cập nhật cấu hình phòng thành công');
      await loadRooms();
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTableLayouts = async () => {
    if (!selectedRoomId) return;
    setSaving(true);
    try {
      const layouts = Object.entries(tableEdits).map(([id, edit]) => ({
        tableId: Number(id),
        layoutX: edit.layoutX,
        layoutY: edit.layoutY,
        layoutRadius: edit.layoutRadius,
        layoutRotation: edit.layoutRotation,
        displayLabel: edit.displayLabel || null,
        capacity: edit.capacity,
      }));
      await api.put(`/api/floor-plans/rooms/${selectedRoomId}/tables/layout/bulk`, layouts);
      toast.success('Lưu vị trí bàn thành công');
      setEditMode(false);
      await loadTables(selectedRoomId);
    } catch {
      toast.error('Lưu vị trí thất bại');
    } finally {
      setSaving(false);
    }
  };

  const getContainerCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 50, y: 50 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const handleDragStart = (tableId: number, e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    setDragging(tableId);
    const edit = tableEdits[tableId];
    if (!edit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const tablePixelX = (edit.layoutX / 100) * rect.width;
    const tablePixelY = (edit.layoutY / 100) * rect.height;
    dragOffset.current = {
      x: e.clientX - rect.left - tablePixelX,
      y: e.clientY - rect.top - tablePixelY,
    };
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (dragging === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - dragOffset.current.x;
    const pixelY = e.clientY - rect.top - dragOffset.current.y;
    const x = Math.max(0, Math.min(100, (pixelX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (pixelY / rect.height) * 100));
    setTableEdits(prev => ({
      ...prev,
      [dragging]: { ...prev[dragging], layoutX: Math.round(x * 10) / 10, layoutY: Math.round(y * 10) / 10 },
    }));
  }, [dragging]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragging, handleDragMove, handleDragEnd]);

  const selectedEdit = selectedTableId ? tableEdits[selectedTableId] : null;
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const statusColorMap: Record<string, string> = {
    EMPTY: '#22c55e',
    OCCUPIED: '#ef4444',
    RESERVED: '#f59e0b',
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Floor Plan Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý sơ đồ sàn và vị trí bàn</p>
        </div>
      </div>

      {/* Room Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {rooms.map(room => (
          <button
            key={room.id}
            onClick={() => { setSelectedRoomId(room.id); setSelectedTableId(null); setEditMode(false); }}
            className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${
              selectedRoomId === room.id
                ? 'bg-[#25439b] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      {selectedRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Config */}
          <div className="space-y-4">
            {/* Floor Plan Config */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Sơ đồ sàn</h3>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Upload hình ảnh</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-[#25439b] hover:text-[#25439b] transition-colors"
                >
                  📷 Chọn file ảnh
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">hoặc dán URL hình ảnh</label>
                <input
                  type="text"
                  value={floorUrl}
                  onChange={e => setFloorUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Chiều rộng</label>
                  <input
                    type="number"
                    value={floorWidth}
                    onChange={e => setFloorWidth(e.target.value)}
                    placeholder="px"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Chiều cao</label>
                  <input
                    type="number"
                    value={floorHeight}
                    onChange={e => setFloorHeight(e.target.value)}
                    placeholder="px"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveRoomConfig}
                disabled={saving}
                className="w-full py-2 bg-[#25439b] hover:bg-[#1c3580] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>

            {/* 360 Panorama Config */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Ảnh 360</h3>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">URL ảnh/lien kết 360</label>
                <input
                  type="text"
                  value={panoramaUrl}
                  onChange={e => setPanoramaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Loại</label>
                <select
                  value={panoramaType}
                  onChange={e => setPanoramaType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                >
                  <option value="IMAGE_360">Ảnh 360</option>
                  <option value="EXTERNAL_LINK">Liên kết ngoài</option>
                </select>
              </div>
              <button
                onClick={handleSaveRoomConfig}
                disabled={saving}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Lưu cấu hình 360
              </button>
            </div>

            {/* Table Position Editor */}
            {selectedEdit && selectedTable && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Chỉnh sửa: {selectedTable.name}
                </h3>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Tên hiển thị</label>
                  <input
                    type="text"
                    value={selectedEdit.displayLabel}
                    onChange={e => setTableEdits(prev => ({
                      ...prev,
                      [selectedTableId!]: { ...prev[selectedTableId!], displayLabel: e.target.value },
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Số chỗ</label>
                    <input
                      type="number"
                      value={selectedEdit.capacity}
                      onChange={e => setTableEdits(prev => ({
                        ...prev,
                        [selectedTableId!]: { ...prev[selectedTableId!], capacity: parseInt(e.target.value) || 4 },
                      }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Bán kính</label>
                    <input
                      type="number"
                      value={selectedEdit.layoutRadius}
                      onChange={e => setTableEdits(prev => ({
                        ...prev,
                        [selectedTableId!]: { ...prev[selectedTableId!], layoutRadius: parseFloat(e.target.value) || 25 },
                      }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">X (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedEdit.layoutX}
                      onChange={e => setTableEdits(prev => ({
                        ...prev,
                        [selectedTableId!]: { ...prev[selectedTableId!], layoutX: parseFloat(e.target.value) || 0 },
                      }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Y (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedEdit.layoutY}
                      onChange={e => setTableEdits(prev => ({
                        ...prev,
                        [selectedTableId!]: { ...prev[selectedTableId!], layoutY: parseFloat(e.target.value) || 0 },
                      }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Rotation (độ)</label>
                  <input
                    type="number"
                    value={selectedEdit.layoutRotation}
                    onChange={e => setTableEdits(prev => ({
                      ...prev,
                      [selectedTableId!]: { ...prev[selectedTableId!], layoutRotation: parseFloat(e.target.value) || 0 },
                    }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25439b]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Center: Floor Plan Preview */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Sơ đồ sàn — {selectedRoom.name}</h3>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => { setEditMode(false); setSelectedTableId(null); }}
                      className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveTableLayouts}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {saving ? 'Đang lưu...' : '💾 Lưu vị trí'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-3 py-1.5 text-xs bg-[#25439b] text-white rounded-lg hover:bg-[#1c3580]"
                  >
                    ✏️ Chỉnh sửa bàn
                  </button>
                )}
              </div>
            </div>

            <div
              ref={containerRef}
              className="relative w-full bg-slate-100 rounded-lg overflow-hidden select-none"
              style={{ aspectRatio: (floorWidth && floorHeight) ? `${floorWidth} / ${floorHeight}` : '5 / 4' }}
            >
              {floorUrl ? (
                <img
                  src={floorUrl}
                  alt="Floor plan"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                  Chưa có sơ đồ sàn
                </div>
              )}

              {tables.map(table => {
                const edit = tableEdits[table.id];
                if (!edit) return null;
                const isSelected = selectedTableId === table.id;
                const radius = edit.layoutRadius || 25;
                return (
                  <div
                    key={table.id}
                    onMouseDown={(e) => {
                      if (editMode) {
                        handleDragStart(table.id, e);
                      } else {
                        setSelectedTableId(table.id);
                      }
                    }}
                    onClick={() => !editMode && setSelectedTableId(table.id)}
                    className={`absolute flex items-center justify-center text-white text-[10px] font-bold rounded-full transition-shadow ${
                      editMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                    } ${isSelected ? 'ring-2 ring-[#25439b] ring-offset-1' : ''}`}
                    style={{
                      left: `${edit.layoutX}%`,
                      top: `${edit.layoutY}%`,
                      width: radius * 2,
                      height: radius * 2,
                      transform: `translate(-50%, -50%) rotate(${edit.layoutRotation}deg)`,
                      backgroundColor: statusColorMap[table.status] || '#94a3b8',
                      zIndex: isSelected ? 10 : 1,
                    }}
                    title={`${table.name} — ${table.capacity} chỗ — ${table.status}`}
                  >
                    <span style={{ transform: `rotate(-${edit.layoutRotation}deg)` }}>
                      {edit.displayLabel || table.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Trống</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Đang dùng</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Đặt trước</span>
              </div>
              {editMode && (
                <span className="text-[#25439b] font-medium">Kéo thả để di chuyển bàn</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
