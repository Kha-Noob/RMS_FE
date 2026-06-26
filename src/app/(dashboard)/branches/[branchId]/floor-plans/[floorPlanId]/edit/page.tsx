'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { FloorPlan, FloorPlanObject, FloorPlanStyle } from '@/types';

const OBJECT_TYPES = [
  { type: 'table', label: 'Bàn tròn', shape: 'circle', icon: '🪑', defaults: { width: 80, height: 80 } },
  { type: 'table', label: 'Bàn vuông', shape: 'rectangle', icon: '🪑', defaults: { width: 80, height: 80 } },
  { type: 'table', label: 'Bàn dài', shape: 'rectangle', icon: '🪑', defaults: { width: 120, height: 60 } },
  { type: 'wall', label: 'Tường', shape: 'rectangle', icon: '🧱', defaults: { width: 200, height: 20 } },
  { type: 'door', label: 'Cửa', shape: 'arc', icon: '🚪', defaults: { width: 100, height: 30 } },
  { type: 'window', label: 'Cửa sổ', shape: 'rectangle', icon: '🪟', defaults: { width: 100, height: 15 } },
  { type: 'toilet', label: 'WC', shape: 'rectangle', icon: '🚻', defaults: { width: 80, height: 80 } },
  { type: 'cashier', label: 'Thu ngân', shape: 'rectangle', icon: '💰', defaults: { width: 150, height: 80 } },
  { type: 'kitchen', label: 'Bếp', shape: 'rectangle', icon: '🍳', defaults: { width: 200, height: 150 } },
  { type: 'bar', label: 'Quầy bar', shape: 'rectangle', icon: '🍸', defaults: { width: 200, height: 60 } },
  { type: 'text', label: 'Nhãn', shape: 'rectangle', icon: '📝', defaults: { width: 150, height: 40 } },
  { type: 'blocked_area', label: 'Chặn', shape: 'rectangle', icon: '🚫', defaults: { width: 100, height: 100 } },
];

const TYPE_COLORS: Record<string, string> = {
  table: '#22c55e',
  wall: '#333333',
  door: '#8B4513',
  window: '#87CEEB',
  toilet: '#6B7280',
  cashier: '#DAA520',
  kitchen: '#FF6347',
  bar: '#4A90D9',
  text: '#666666',
  decoration: '#228B22',
  blocked_area: '#94a3b8',
  stairs: '#78716c',
};

export default function FloorPlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;
  const floorPlanId = params.floorPlanId as string;

  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [objects, setObjects] = useState<FloorPlanObject[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [dragging, setDragging] = useState<number | null>(null);
  const [resizing, setResizing] = useState<{ id: number; handle: string } | null>(null);
  const [panning, setPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, objX: 0, objY: 0, objW: 0, objH: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedObj = objects.find(o => o.id === selectedId);

  const loadFloorPlan = useCallback(async () => {
    try {
      const res = await api.get<FloorPlan>(`/api/floor-plans/${floorPlanId}`);
      setFloorPlan(res);
      setObjects(res.floorPlanObjects || []);
    } catch {
      toast.error('Không tải được floor plan');
    } finally {
      setLoading(false);
    }
  }, [floorPlanId]);

  useEffect(() => { loadFloorPlan(); }, [loadFloorPlan]);

  const parseStyle = (json: string | null): FloorPlanStyle => {
    if (!json) return {};
    try { return JSON.parse(json) as FloorPlanStyle; } catch { return {}; }
  };

  const parseMeta = (json: string | null): Record<string, unknown> => {
    if (!json) return {};
    try { return JSON.parse(json) as Record<string, unknown>; } catch { return {}; }
  };

  const getObjectColor = (obj: FloorPlanObject) => {
    const style = parseStyle(obj.styleJson);
    if (obj.objectType === 'table') return style.fillColor || TYPE_COLORS.table;
    return style.color || TYPE_COLORS[obj.objectType] || '#94a3b8';
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning(true);
      dragStart.current = { x: e.clientX, y: e.clientY, objX: panOffset.x, objY: panOffset.y, objW: 0, objH: 0 };
      e.preventDefault();
    } else if (e.button === 0 && e.target === canvasRef.current) {
      setSelectedId(null);
    }
  };

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (panning) {
      setPanOffset({
        x: dragStart.current.objX + (e.clientX - dragStart.current.x),
        y: dragStart.current.objY + (e.clientY - dragStart.current.y),
      });
      return;
    }

    if (dragging !== null) {
      const dx = (e.clientX - dragStart.current.x) / zoom;
      const dy = (e.clientY - dragStart.current.y) / zoom;
      setObjects(prev => prev.map(o =>
        o.id === dragging ? { ...o, x: dragStart.current.objX + dx, y: dragStart.current.objY + dy } : o
      ));
      return;
    }

    if (resizing) {
      const dx = (e.clientX - dragStart.current.x) / zoom;
      const dy = (e.clientY - dragStart.current.y) / zoom;
      setObjects(prev => prev.map(o => {
        if (o.id !== resizing.id) return o;
        let newX = o.x, newY = o.y, newW = o.width, newH = o.height;
        const h = resizing.handle;
        if (h.includes('e')) newW = Math.max(20, dragStart.current.objW + dx);
        if (h.includes('w')) { newW = Math.max(20, dragStart.current.objW - dx); newX = dragStart.current.objX + dx; }
        if (h.includes('s')) newH = Math.max(20, dragStart.current.objH + dy);
        if (h.includes('n')) { newH = Math.max(20, dragStart.current.objH - dy); newY = dragStart.current.objY + dy; }
        return { ...o, x: newX, y: newY, width: newW, height: newH };
      }));
    }
  }, [dragging, resizing, panning, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    setDragging(null);
    setResizing(null);
    setPanning(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  const handleObjectMouseDown = (e: React.MouseEvent, obj: FloorPlanObject) => {
    e.stopPropagation();
    setSelectedId(obj.id);
    setDragging(obj.id);
    dragStart.current = { x: e.clientX, y: e.clientY, objX: obj.x, objY: obj.y, objW: obj.width, objH: obj.height };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, obj: FloorPlanObject, handle: string) => {
    e.stopPropagation();
    setSelectedId(obj.id);
    setResizing({ id: obj.id, handle });
    dragStart.current = { x: e.clientX, y: e.clientY, objX: obj.x, objY: obj.y, objW: obj.width, objH: obj.height };
  };

  const addObject = (toolIdx: number) => {
    const tool = OBJECT_TYPES[toolIdx];
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect || !floorPlan) return;

    const newObj: FloorPlanObject = {
      id: Date.now(),
      floorPlan: floorPlan,
      objectType: tool.type,
      label: `${tool.type === 'table' ? 'T' : tool.type.charAt(0).toUpperCase() + tool.type.slice(1)}${objects.length + 1}`,
      x: (canvasRect.width / 2 - panOffset.x) / zoom - tool.defaults.width / 2,
      y: (canvasRect.height / 2 - panOffset.y) / zoom - tool.defaults.height / 2,
      width: tool.defaults.width,
      height: tool.defaults.height,
      rotation: 0,
      shape: tool.shape,
      zIndex: tool.type === 'table' ? 10 : tool.type === 'wall' ? 1 : 5,
      styleJson: JSON.stringify({ fillColor: TYPE_COLORS[tool.type] || '#94a3b8' }),
      metadataJson: tool.type === 'table' ? JSON.stringify({ tableCode: `T${objects.length + 1}`, capacity: 4, zone: '' }) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setObjects(prev => [...prev, newObj]);
    setSelectedId(newObj.id);
  };

  const deleteSelected = () => {
    if (selectedId === null) return;
    setObjects(prev => prev.filter(o => o.id !== selectedId));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedObj) return;
    const dup = { ...selectedObj, id: Date.now(), x: selectedObj.x + 30, y: selectedObj.y + 30, label: selectedObj.label + ' copy' };
    setObjects(prev => [...prev, dup]);
    setSelectedId(dup.id);
  };

  const updateSelected = (field: string, value: unknown) => {
    if (selectedId === null) return;
    setObjects(prev => prev.map(o => o.id === selectedId ? { ...o, [field]: value } : o));
  };

  const updateSelectedStyle = (key: string, value: string) => {
    if (selectedId === null) return;
    setObjects(prev => prev.map(o => {
      if (o.id !== selectedId) return o;
      const style = parseStyle(o.styleJson);
      style[key] = value;
      return { ...o, styleJson: JSON.stringify(style) };
    }));
  };

  const updateSelectedMeta = (key: string, value: unknown) => {
    if (selectedId === null) return;
    setObjects(prev => prev.map(o => {
      if (o.id !== selectedId) return o;
      const meta = parseMeta(o.metadataJson);
      meta[key] = value;
      return { ...o, metadataJson: JSON.stringify(meta) };
    }));
  };

  const handleSave = async () => {
    if (!floorPlan) return;
    setSaving(true);
    try {
      const payload = objects.map(o => ({
        objectType: o.objectType,
        label: o.label,
        x: Math.round(o.x * 10) / 10,
        y: Math.round(o.y * 10) / 10,
        width: Math.round(o.width * 10) / 10,
        height: Math.round(o.height * 10) / 10,
        rotation: Math.round(o.rotation * 10) / 10,
        shape: o.shape,
        zIndex: o.zIndex,
        styleJson: o.styleJson,
        metadataJson: o.metadataJson,
      }));
      await api.put(`/api/floor-plans/${floorPlanId}/objects/bulk`, payload);
      toast.success('Lưu thành công');
    } catch {
      toast.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!floorPlan) return;
    try {
      await handleSave();
      await api.post(`/api/floor-plans/${floorPlanId}/publish`);
      toast.success('Đã publish');
      await loadFloorPlan();
    } catch {
      toast.error('Publish thất bại');
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); duplicateSelected(); }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave(); }
  }, [selectedId, objects]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
      </div>
    );
  }

  if (!floorPlan) {
    return <div className="text-center py-12 text-slate-500">Floor plan không tồn tại</div>;
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-0 bg-slate-50 -m-4 lg:-m-6 rounded-lg overflow-hidden">
      {/* Left: Toolbox */}
      <div className="w-48 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase">Toolbox</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {OBJECT_TYPES.map((tool, idx) => (
            <button
              key={idx}
              onClick={() => addObject(idx)}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left"
              title={`Thêm ${tool.label}`}
            >
              <span className="text-base">{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-slate-200 space-y-1">
          <button onClick={() => { setZoom(z => Math.min(3, z + 0.1)); }} className="w-full px-2 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">Zoom +</button>
          <button onClick={() => { setZoom(z => Math.max(0.2, z - 0.1)); }} className="w-full px-2 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">Zoom −</button>
          <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="w-full px-2 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">Reset View</button>
          <label className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="rounded" />
            Grid
          </label>
        </div>
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-10 bg-white border-b border-slate-200 flex items-center px-3 gap-2">
          <button onClick={() => router.push(`/branches/${branchId}/floor-plans`)} className="text-sm text-slate-500 hover:text-slate-700">← Quay lại</button>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <span className="text-sm font-medium text-slate-700">{floorPlan.name}</span>
          <span className="text-xs text-slate-400">· Tầng {floorPlan.floorNumber}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${floorPlan.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {floorPlan.status}
          </span>
          <div className="flex-1" />
          <span className="text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
          <span className="text-xs text-slate-400">· {objects.length} objects</span>
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <button onClick={handlePublish} className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Publish</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs bg-[#25439b] text-white rounded-lg hover:bg-[#1c3580] disabled:opacity-50">
            {saving ? 'Lưu...' : 'Lưu (Ctrl+S)'}
          </button>
        </div>

        {/* Canvas Area */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-hidden relative cursor-crosshair"
          style={{ background: showGrid ? 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 20px 20px' : '#f8fafc' }}
          onMouseDown={handleCanvasMouseDown}
        >
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: floorPlan.width,
              height: floorPlan.height,
              position: 'relative',
            }}
          >
            {/* Background image */}
            {floorPlan.backgroundImageUrl && (
              <img
                src={floorPlan.backgroundImageUrl}
                alt="Background"
                className="absolute inset-0 pointer-events-none"
                style={{ width: floorPlan.width, height: floorPlan.height, objectFit: 'contain' }}
                draggable={false}
              />
            )}

            {/* Objects */}
            {objects.map(obj => {
              const isSelected = selectedId === obj.id;
              const color = getObjectColor(obj);
              const style = parseStyle(obj.styleJson);
              const meta = parseMeta(obj.metadataJson);
              const isTable = obj.objectType === 'table';

              return (
                <div
                  key={obj.id}
                  onMouseDown={(e) => handleObjectMouseDown(e, obj)}
                  className="absolute group"
                  style={{
                    left: obj.x,
                    top: obj.y,
                    width: obj.width,
                    height: obj.height,
                    transform: `rotate(${obj.rotation}deg)`,
                    zIndex: obj.zIndex,
                    cursor: 'move',
                  }}
                >
                  <div
                    className={`w-full h-full transition-all ${isSelected ? 'ring-2 ring-[#25439b]' : 'hover:ring-1 hover:ring-blue-300'}`}
                    style={{
                      borderRadius: obj.shape === 'circle' ? '50%' : obj.shape === 'arc' ? '50% 50% 0 0' : '4px',
                      backgroundColor: color,
                      opacity: style.opacity || 0.85,
                      border: obj.objectType === 'window' ? '2px solid #5B9BD5' : obj.objectType === 'wall' ? 'none' : undefined,
                    }}
                  >
                    {/* Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-[10px] font-bold text-center drop-shadow-sm leading-tight px-1">
                        {obj.label}
                        {isTable && meta.capacity ? <><br />{String(meta.capacity)} chỗ</> : null}
                      </span>
                    </div>
                  </div>

                  {/* Resize handles */}
                  {isSelected && (
                    <>
                      {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(h => (
                        <div
                          key={h}
                          onMouseDown={(e) => handleResizeMouseDown(e, obj, h)}
                          className="absolute w-2.5 h-2.5 bg-white border-2 border-[#25439b] rounded-sm z-20"
                          style={{
                            top: h.includes('n') ? -5 : h.includes('s') ? 'auto' : '50%',
                            bottom: h.includes('s') ? -5 : 'auto',
                            left: h.includes('w') ? -5 : h.includes('e') ? 'auto' : '50%',
                            right: h.includes('e') ? -5 : 'auto',
                            transform: (!h.includes('n') && !h.includes('s') && !h.includes('w') && !h.includes('e')) ? 'translate(-50%,-50%)' : undefined,
                            cursor: h === 'nw' || h === 'se' ? 'nwse-resize' : h === 'ne' || h === 'sw' ? 'nesw-resize' : h === 'n' || h === 's' ? 'ns-resize' : 'ew-resize',
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Property Panel */}
      <div className="w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase">Properties</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {selectedObj ? (
            <>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Loại</label>
                <div className="text-sm font-medium text-slate-700">{selectedObj.objectType}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Label</label>
                <input
                  type="text"
                  value={selectedObj.label || ''}
                  onChange={e => updateSelected('label', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">X</label>
                  <input type="number" value={Math.round(selectedObj.x)} onChange={e => updateSelected('x', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Y</label>
                  <input type="number" value={Math.round(selectedObj.y)} onChange={e => updateSelected('y', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Width</label>
                  <input type="number" value={Math.round(selectedObj.width)} onChange={e => updateSelected('width', parseFloat(e.target.value) || 20)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Height</label>
                  <input type="number" value={Math.round(selectedObj.height)} onChange={e => updateSelected('height', parseFloat(e.target.value) || 20)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Rotation</label>
                  <input type="number" value={Math.round(selectedObj.rotation)} onChange={e => updateSelected('rotation', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Z-Index</label>
                  <input type="number" value={selectedObj.zIndex} onChange={e => updateSelected('zIndex', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Shape</label>
                <select
                  value={selectedObj.shape || 'rectangle'}
                  onChange={e => updateSelected('shape', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                >
                  <option value="circle">Circle</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="arc">Arc</option>
                  <option value="line">Line</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Màu</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={getObjectColor(selectedObj)}
                    onChange={e => {
                      const key = selectedObj.objectType === 'table' ? 'fillColor' : 'color';
                      updateSelectedStyle(key, e.target.value);
                    }}
                    className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500">{getObjectColor(selectedObj)}</span>
                </div>
              </div>

              {/* Table-specific fields */}
              {selectedObj.objectType === 'table' && (
                <>
                  <div className="border-t border-slate-100 pt-3">
                    <label className="text-xs text-slate-500 mb-1 block">Mã bàn</label>
                    <input
                      type="text"
                      value={String(parseMeta(selectedObj.metadataJson).tableCode || '')}
                      onChange={e => updateSelectedMeta('tableCode', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Số chỗ ngồi</label>
                    <input
                      type="number"
                      value={Number(parseMeta(selectedObj.metadataJson).capacity) || 4}
                      onChange={e => updateSelectedMeta('capacity', parseInt(e.target.value) || 4)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Khu vực</label>
                    <input
                      type="text"
                      value={String(parseMeta(selectedObj.metadataJson).zone || '')}
                      onChange={e => updateSelectedMeta('zone', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Linked POS Table ID</label>
                    <input
                      type="text"
                      value={String(parseMeta(selectedObj.metadataJson).tableId || '')}
                      onChange={e => updateSelectedMeta('tableId', e.target.value)}
                      placeholder="VD: 123"
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#25439b]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!parseMeta(selectedObj.metadataJson).isMergeable}
                      onChange={e => updateSelectedMeta('isMergeable', e.target.checked)}
                      className="rounded"
                    />
                    Có thể gộp bàn
                  </label>
                </>
              )}

              {/* AI Draft placeholder */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  disabled
                  className="w-full py-2 px-3 text-xs bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed"
                >
                  🤖 Generate Draft from Image (Coming Soon)
                </button>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400 text-center mt-8">
              Chọn một object để xem properties
            </div>
          )}
        </div>

        {/* Actions */}
        {selectedObj && (
          <div className="p-3 border-t border-slate-200 flex gap-1">
            <button onClick={duplicateSelected} className="flex-1 px-2 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">Nhân bản</button>
            <button onClick={() => updateSelected('zIndex', (selectedObj.zIndex || 0) + 1)} className="px-2 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">↑</button>
            <button onClick={() => updateSelected('zIndex', Math.max(0, (selectedObj.zIndex || 0) - 1))} className="px-2 py-1.5 text-xs bg-slate-100 rounded hover:bg-slate-200">↓</button>
            <button onClick={deleteSelected} className="px-2 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">🗑</button>
          </div>
        )}
      </div>
    </div>
  );
}
