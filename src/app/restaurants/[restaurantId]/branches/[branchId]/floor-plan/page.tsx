'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import FloorPlanBackground from '@/components/FloorPlanBackground';
import ObjectRenderer from '@/components/layout-builder/ObjectRenderer';
import { getFloorPlanStageSize, getWidthScale } from '@/lib/floorPlanViewport';
import type { FloorPlan, FloorPlanObject, TableEntity } from '@/types';

const PannellumViewer = dynamic(() => import('@/components/PannellumViewer'), { ssr: false });

const STATUS_LABELS: Record<string, string> = {
  EMPTY: 'Trống',
  OCCUPIED: 'Đang dùng',
  RESERVED: 'Đặt trước',
};

function asJsonObject(value: FloorPlanObject['metadataJson']): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return value;
}

export default function PublicFloorPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const branchId = params.branchId as string;
  const fpId = searchParams.get('fpId');

  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [floorPlanObjects, setFloorPlanObjects] = useState<FloorPlanObject[]>([]);
  const [tables, setTables] = useState<TableEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null);
  const [show360Modal, setShow360Modal] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const objectsLoadIdRef = useRef(0);

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

  const loadFloorPlanObjects = useCallback(async (planId: number) => {
    const thisLoad = ++objectsLoadIdRef.current;
    setFloorPlanObjects([]);
    try {
      const res = await api.get<{ floorPlan: FloorPlan; objects: FloorPlanObject[] }>(
        `/api/public/floor-plans/${planId}`
      );
      if (thisLoad !== objectsLoadIdRef.current) return;
      setFloorPlanObjects(res.objects || []);
    } catch {
      if (thisLoad !== objectsLoadIdRef.current) return;
      setFloorPlanObjects([]);
    }
  }, []);

  const loadTables = useCallback(async () => {
    try {
      const res = await api.get<TableEntity[]>('/api/pos/tables', { params: { branchId } });
      setTables(res);
    } catch {}
  }, [branchId]);

  useEffect(() => { loadFloorPlans(); loadTables(); }, [loadFloorPlans, loadTables]);

  useEffect(() => {
    if (selectedPlan) loadFloorPlanObjects(selectedPlan.id);
  }, [selectedPlan, loadFloorPlanObjects]);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el || !selectedPlan) return;

    const measure = () => {
      const width = el.clientWidth;
      const stage = getFloorPlanStageSize(selectedPlan);
      setPreviewScale(getWidthScale(width, stage.width));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedPlan]);

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
          <p className="text-slate-500">No floor plan available.</p>
        </div>
      </div>
    );
  }

  const { width: stageWidth, height: stageHeight } = getFloorPlanStageSize(selectedPlan);
  const scaledStageWidth = stageWidth * previewScale;
  const scaledStageHeight = stageHeight * previewScale;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{selectedPlan.name}</h1>
            <p className="text-xs text-slate-400">Tầng {selectedPlan.floorNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {floorPlans.length > 1 && (
              <select value={selectedPlan.id} onChange={e => { const plan = floorPlans.find(p => p.id === Number(e.target.value)); if (plan) { setSelectedPlan(plan); setSelectedTable(null); } }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
                {floorPlans.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            )}
            {selectedPlan.panoramaUrl && (
              <button onClick={() => setShow360Modal(true)} className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 font-medium">🌐 Xem 360°</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div ref={previewContainerRef} className="w-full overflow-auto p-4">
          <div className="relative mx-auto" style={{ width: scaledStageWidth, height: scaledStageHeight }}>
            <div
              className="absolute left-0 top-0"
              style={{
                width: stageWidth,
                height: stageHeight,
                transform: `scale(${previewScale})`,
                transformOrigin: '0 0',
              }}
            >
            <FloorPlanBackground floorPlan={{
              ...selectedPlan,
              branch: {} as any,
              createdBy: null, updatedBy: null, createdAt: '', updatedAt: '',
            }} className="w-full h-full">
              {[...floorPlanObjects].sort((a, b) => a.zIndex - b.zIndex).map(obj => {
                const meta = asJsonObject(obj.metadataJson);
                const linkedTableId = meta.tableEntityId ?? meta.tableId ?? meta.linkedTableId;
                const posTable = linkedTableId ? tables.find(t => t.id === linkedTableId) : null;
                const isSelected = posTable ? selectedTable?.id === posTable.id : false;

                return (
                  <ObjectRenderer
                    key={obj.id}
                    object={{ ...obj, posTable } as any}
                    isEditor={false}
                    isSelected={isSelected}
                    onClick={posTable ? () => setSelectedTable(isSelected ? null : posTable) : undefined}
                  />
                );
              })}
            </FloorPlanBackground>
            </div>
          </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Trống</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Đang dùng</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span>Đặt trước</span></div>
        </div>
      </main>

      {selectedTable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 z-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800">{selectedTable.name}</h3>
              <p className="text-sm text-slate-500 mt-1">Số chỗ: {selectedTable.capacity}<br />Trạng thái: {STATUS_LABELS[selectedTable.status] || selectedTable.status}</p>
            </div>
            <button onClick={() => setSelectedTable(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        </div>
      )}

      {show360Modal && selectedPlan.panoramaUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShow360Modal(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl z-10 bg-white/10 w-10 h-10 rounded-full flex items-center justify-center">✕</button>
          <div className="w-[95vw] h-[90vh] rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <PannellumViewer imageUrl={selectedPlan.panoramaUrl} className="w-full h-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
