'use client';

import { useState } from 'react';
import type { FloorPlanObject } from '@/types';
import { getObjectDefinition } from '@/components/object-registry';
import { getObjectSvg } from '@/components/svg-assets';

function asJsonObject(value: FloorPlanObject['styleJson']): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return value;
}

function jsonString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function jsonNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}

interface PropertyPanelProps {
  object: FloorPlanObject | null;
  objects: FloorPlanObject[];
  floorPlanStatus?: string;
  onUpdate: (id: number, field: string, value: unknown) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onBringFront: (id: number) => void;
  onSendBack: (id: number) => void;
  onBringForward?: (id: number) => void;
  onSendBackward?: (id: number) => void;
}

function PanelSection({ title, icon, defaultOpen = true, children }: { title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
      >
        <span className="text-slate-400">{icon}</span>
        <span className="flex-1 text-left uppercase tracking-wider">{title}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[11px] text-slate-500 mb-1 block font-medium">{label}</label>
      {children}
    </div>
  );
}

export default function PropertyPanel({ object, objects, floorPlanStatus, onUpdate, onDelete, onDuplicate, onBringFront, onSendBack, onBringForward, onSendBackward }: PropertyPanelProps) {
  if (!object) {
    return (
      <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <p className="text-xs text-slate-400">Select an object to view properties</p>
          </div>
        </div>
      </div>
    );
  }

  const def = getObjectDefinition(object.objectType);
  const style = asJsonObject(object.styleJson);
  const meta = asJsonObject(object.metadataJson);
  const maxZ = Math.max(0, ...objects.map(o => o.zIndex));
  const SvgComp = getObjectSvg(object.objectType);
  const fillColor = jsonString(style.fillColor, '#808080');
  const strokeColor = jsonString(style.strokeColor, '#666666');
  const opacity = jsonNumber(style.opacity, 1);
  const capacity = jsonNumber(meta.capacity, 4);
  const zone = jsonString(meta.zone, '');

  const updateStyle = (key: string, value: unknown) => {
    const newStyle = { ...style, [key]: value };
    onUpdate(object.id, 'styleJson', newStyle);
  };

  const updateMeta = (key: string, value: unknown) => {
    const newMeta = { ...meta, [key]: value };
    onUpdate(object.id, 'metadataJson', newMeta);
  };

  const isTable = def?.isTable;
  const tableEntityId = meta.tableEntityId as number | undefined;

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
          {SvgComp ? <SvgComp width={32} height={32} /> : <span className="text-lg">{def?.icon || '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{def?.label || object.objectType}</h3>
          <p className="text-[10px] text-slate-400">ID: {object.id}</p>
        </div>
        <button onClick={() => onDelete(object.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        <PanelSection title="General" icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>}>
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
              <input type="checkbox" checked={object.isVisible !== false}
                onChange={e => onUpdate(object.id, 'isVisible', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300" />
              Visible
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
              <input type="checkbox" checked={!!object.isLocked}
                onChange={e => onUpdate(object.id, 'isLocked', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300" />
              Locked
            </label>
          </div>
          <Field label="Label">
            <input value={object.label || ''} onChange={e => onUpdate(object.id, 'label', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" placeholder="Enter label..." />
          </Field>
        </PanelSection>

        <PanelSection title="Transform" icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>}>
          <div className="grid grid-cols-2 gap-2">
            <Field label="X (%)">
              <input type="number" step="0.1" value={Math.round(object.x * 10) / 10}
                onChange={e => onUpdate(object.id, 'x', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" />
            </Field>
            <Field label="Y (%)">
              <input type="number" step="0.1" value={Math.round(object.y * 10) / 10}
                onChange={e => onUpdate(object.id, 'y', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" />
            </Field>
            <Field label="Width">
              <input type="number" value={object.width}
                onChange={e => onUpdate(object.id, 'width', parseFloat(e.target.value) || 20)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" />
            </Field>
            <Field label="Height">
              <input type="number" value={object.height}
                onChange={e => onUpdate(object.id, 'height', parseFloat(e.target.value) || 20)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" />
            </Field>
          </div>
          <Field label="Rotation">
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="360" step="1" value={Math.round(object.rotation)}
                onChange={e => onUpdate(object.id, 'rotation', parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#25439b]" />
              <input type="number" value={Math.round(object.rotation)}
                onChange={e => onUpdate(object.id, 'rotation', parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b]" />
              <span className="text-[10px] text-slate-400">deg</span>
            </div>
          </Field>
        </PanelSection>

        <PanelSection title="Appearance" icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>}>
          <div className="grid grid-cols-2 gap-2">
            <Field label={isTable ? "Màu mặt bàn" : "Fill"}>
              <div className="flex items-center gap-2">
                <input type="color" value={fillColor}
                  onChange={e => updateStyle('fillColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-[10px] text-slate-500 font-mono">{fillColor}</span>
              </div>
            </Field>
            <Field label={isTable ? "Màu viền thiết kế" : "Stroke"}>
              <div className="flex items-center gap-2">
                <input type="color" value={strokeColor}
                  onChange={e => updateStyle('strokeColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer" />
                <span className="text-[10px] text-slate-500 font-mono">{strokeColor}</span>
              </div>
            </Field>
          </div>
          {isTable && (
            <p className="text-[10px] text-slate-400 italic mt-1">Màu trạng thái POS sẽ hiển thị riêng bằng viền sáng, không phải màu thiết kế.</p>
          )}
          <Field label="Opacity">
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="1" step="0.05" value={opacity}
                onChange={e => updateStyle('opacity', parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#25439b]" />
              <span className="text-[10px] text-slate-500 font-mono w-8 text-right">{Math.round(opacity * 100)}%</span>
            </div>
          </Field>
        </PanelSection>

        {isTable && (
          <PanelSection title="Table Info" icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="2"/></svg>}>
            <Field label="Tên bàn / Label">
              <input value={object.label || ''} onChange={e => onUpdate(object.id, 'label', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" placeholder="Bàn 01" />
            </Field>
            <Field label="Sức chứa / Capacity">
              <input type="number" min="1" max="50" value={capacity}
                onChange={e => updateMeta('capacity', parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" />
            </Field>
            <Field label="Khu vực / Zone">
              <input value={zone} onChange={e => updateMeta('zone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] focus:ring-1 focus:ring-[#25439b]/20 transition-all" placeholder="VIP, Sân vườn..." />
            </Field>
          </PanelSection>
        )}

        {isTable && (
          <PanelSection title="POS Sync" defaultOpen={false} icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>}>
            {floorPlanStatus === 'published' && tableEntityId ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-emerald-700 font-medium">Đã đồng bộ POS</span>
                </div>
                <p className="text-[10px] text-slate-400">POS Table ID: {tableEntityId}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[11px] text-amber-700">Sẽ được đồng bộ sang POS sau khi Publish</span>
              </div>
            )}
          </PanelSection>
        )}

        <PanelSection title="Layer" icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}>
          <Field label="Z-Index">
            <div className="flex items-center gap-2">
              <input type="number" value={object.zIndex}
                onChange={e => onUpdate(object.id, 'zIndex', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] transition-all" />
              <div className="flex gap-1">
                <button onClick={() => onBringFront(object.id)} className="px-2 py-1.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium" title="Bring to front">Front</button>
                <button onClick={() => onSendBack(object.id)} className="px-2 py-1.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-md transition-colors font-medium" title="Send to back">Back</button>
              </div>
            </div>
            <div className="flex gap-1 mt-1.5">
              <button onClick={() => onBringForward?.(object.id)} className="flex-1 px-2 py-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors">Forward</button>
              <button onClick={() => onSendBackward?.(object.id)} className="flex-1 px-2 py-1.5 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors">Backward</button>
            </div>
          </Field>
        </PanelSection>

        <PanelSection title="Actions" icon={<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>}>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onDuplicate(object.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Duplicate
            </button>
            <button onClick={() => onDelete(object.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              Delete
            </button>
          </div>
        </PanelSection>
      </div>
    </div>
  );
}
