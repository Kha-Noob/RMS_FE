'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { FloorPlan, FloorPlanObject } from '@/types';

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

const STATUS_LABELS: Record<string, string> = {
  available: 'Trống',
  occupied: 'Đang dùng',
  reserved: 'Đặt trước',
  cleaning: 'Đang dọn',
  disabled: 'Không khả dụng',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
  cleaning: 'bg-blue-500',
  disabled: 'bg-gray-400',
};

export default function PublicFloorPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params.branchId as string;
  const fpId = searchParams.get('fpId');

  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedObj, setSelectedObj] = useState<FloorPlanObject | null>(null);
  const [show360Modal, setShow360Modal] = useState(false);
  const [zoom, setZoom] = useState(1);

  const loadFloorPlans = useCallback(async () => {
    try {
      const res = await api.get<FloorPlan[]>(`/api/public/branches/${branchId}/floor-plans`);
      setFloorPlans(res);

      if (fpId) {
        const plan = res.find(p => p.id === Number(fpId));
        if (plan) { setSelectedPlan(plan); setLoading(false); return; }
      }

      if (res.length > 0) setSelectedPlan(res[0]);
    } catch {
      // Silent fail for public page
    } finally {
      setLoading(false);
    }
  }, [branchId, fpId]);

  useEffect(() => { loadFloorPlans(); }, [loadFloorPlans]);

  const parseStyle = (json: string | null): Record<string, unknown> => {
    if (!json) return {};
    try { return JSON.parse(json) as Record<string, unknown>; } catch { return {}; }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Sơ đồ tầng</h1>
          <p className="text-slate-500">Không có sơ đồ nào khả dụng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{selectedPlan.name}</h1>
            <p className="text-xs text-slate-400">Tầng {selectedPlan.floorNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {floorPlans.length > 1 && (
              <select
                value={selectedPlan.id}
                onChange={e => {
                  const plan = floorPlans.find(p => p.id === Number(e.target.value));
                  if (plan) setSelectedPlan(plan);
                  setSelectedObj(null);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
              >
                {floorPlans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {selectedPlan.panorama360Url && (
              <button
                onClick={() => setShow360Modal(true)}
                className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600"
              >
                🌐 Xem 360°
              </button>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="px-2 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200">−</button>
              <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="px-2 py-1 text-sm bg-slate-100 rounded hover:bg-slate-200">+</button>
            </div>
          </div>
        </div>
      </header>

      {/* Canvas */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
            <div
              className="relative mx-auto my-4"
              style={{
                width: selectedPlan.width * zoom,
                height: selectedPlan.height * zoom,
                background: 'repeating-conic-gradient(#f1f5f9 0% 25%, transparent 0% 50%) 50% / 20px 20px',
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: selectedPlan.width,
                  height: selectedPlan.height,
                  position: 'relative',
                }}
              >
                {/* Background */}
                {selectedPlan.backgroundImageUrl && (
                  <img
                    src={selectedPlan.backgroundImageUrl}
                    alt="Background"
                    className="absolute inset-0 pointer-events-none"
                    style={{ width: selectedPlan.width, height: selectedPlan.height, objectFit: 'contain' }}
                    draggable={false}
                  />
                )}

                {/* Objects */}
                {(selectedPlan.floorPlanObjects || []).map(obj => {
                  const color = getObjectColor(obj);
                  const style = parseStyle(obj.styleJson);
                  const meta = parseMeta(obj.metadataJson);
                  const isTable = obj.objectType === 'table';

                  return (
                    <div
                      key={obj.id}
                      onClick={() => isTable && setSelectedObj(selectedObj?.id === obj.id ? null : obj)}
                      className={`absolute transition-all ${isTable ? 'cursor-pointer hover:brightness-110' : 'pointer-events-none'}`}
                      style={{
                        left: obj.x,
                        top: obj.y,
                        width: obj.width,
                        height: obj.height,
                        transform: `rotate(${obj.rotation}deg)`,
                        zIndex: obj.zIndex,
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          borderRadius: obj.shape === 'circle' ? '50%' : obj.shape === 'arc' ? '50% 50% 0 0' : '4px',
                          backgroundColor: color as string,
                          opacity: typeof style.opacity === 'number' ? style.opacity : 0.85,
                          border: obj.objectType === 'window' ? '2px solid #5B9BD5' : undefined,
                          outline: selectedObj?.id === obj.id ? '3px solid #25439b' : undefined,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-[10px] font-bold text-center drop-shadow-sm leading-tight px-1">
                            {obj.label}
                            {isTable && meta.capacity ? <><br />{String(meta.capacity)}g</> : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          {Object.entries(TYPE_COLORS).filter(([k]) => ['table', 'wall', 'door', 'window', 'cashier', 'kitchen', 'bar'].includes(k)).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span>{key === 'table' ? 'Bàn' : key === 'wall' ? 'Tường' : key === 'door' ? 'Cửa' : key === 'window' ? 'Cửa sổ' : key === 'cashier' ? 'Thu ngân' : key === 'kitchen' ? 'Bếp' : 'Bar'}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Table Info Popup */}
      {selectedObj && selectedPlan.isTableSelectionEnabled && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 z-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800">{selectedObj.label}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {(() => {
                  const meta = parseMeta(selectedObj.metadataJson);
                  return <>
                    Mã: {meta.tableCode || '—'}<br />
                    Số chỗ: {meta.capacity || '—'}<br />
                    Khu vực: {meta.zone || '—'}
                  </>;
                })()}
              </p>
            </div>
            <button onClick={() => setSelectedObj(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <button className="w-full mt-3 py-2 bg-[#25439b] text-white rounded-lg text-sm font-medium hover:bg-[#1c3580]">
            Chọn bàn này
          </button>
        </div>
      )}

      {/* 360 Modal */}
      {show360Modal && selectedPlan.panorama360Url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShow360Modal(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-slate-300">✕</button>
          <img
            src={selectedPlan.panorama360Url}
            alt="360 panorama"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
