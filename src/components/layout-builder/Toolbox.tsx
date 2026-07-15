'use client';

import { useState, useRef } from 'react';
import { OBJECT_CATEGORIES, getObjectsByCategory, type ObjectDefinition } from '@/components/object-registry';
import { getObjectSvg } from '@/components/svg-assets';
import type { FloorPlan } from '@/types';
import { BACKGROUND_MODES } from '@/types';

interface ToolboxProps {
  onAddObject: (type: string) => void;
  floorPlan?: FloorPlan;
  onChangeBackground?: (mode: string) => void;
  onUploadDiagram?: (file: File) => void;
  onRemoveDiagram?: () => void;
  onSetDiagramFit?: (mode: 'contain' | 'cover' | 'fill') => void;
  onResetDiagramTransform?: () => void;
  onUpload360?: (file: File) => void;
  onPreview360?: () => void;
  hasExistingPosTables: boolean;
  unplacedTables?: Array<{ id: number; name: string; capacity: number }>;
  onPlaceExistingTable?: (tableId: number) => void;
}

function ObjectCard({ item, onAdd }: { item: ObjectDefinition; onAdd: () => void }) {
  const SvgComp = getObjectSvg(item.type);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('objectType', item.type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={onAdd}
      className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-[#25439b]/30 hover:bg-[#25439b]/[0.03] hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150"
      title={`Add ${item.label}`}
    >
      <div className="w-full aspect-square flex items-center justify-center rounded-lg bg-slate-50/80 group-hover:bg-[#25439b]/[0.06] transition-colors overflow-hidden">
        {SvgComp ? <SvgComp width={48} height={48} /> : <span className="text-2xl">{item.icon}</span>}
      </div>
      <span className="text-[10px] font-medium text-slate-600 text-center leading-tight truncate w-full">{item.label}</span>
    </div>
  );
}

export default function Toolbox({
  onAddObject,
  floorPlan,
  onChangeBackground,
  onUploadDiagram,
  onRemoveDiagram,
  onSetDiagramFit,
  onResetDiagramTransform,
  onUpload360,
  onPreview360,
  hasExistingPosTables,
  unplacedTables = [],
  onPlaceExistingTable,
}: ToolboxProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('furniture');
  const [unplacedExpanded, setUnplacedExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const panoramaFileRef = useRef<HTMLInputElement>(null);

  const filteredCategories = OBJECT_CATEGORIES.map(cat => {
    const items = searchQuery
      ? getObjectsByCategory(cat.key).filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : getObjectsByCategory(cat.key);
    return { ...cat, filteredItems: items };
  }).filter(cat => !searchQuery || cat.filteredItems.length > 0);

  const filteredUnplaced = searchQuery
    ? unplacedTables.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : unplacedTables;

  return (
    <div className="w-60 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {floorPlan && onChangeBackground && (
        <div className="border-b border-slate-100 p-3 space-y-3">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Floor Background</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKGROUND_MODES.filter(m => m.value !== 'CUSTOM_IMAGE').map(mode => (
              <button key={mode.value} onClick={() => onChangeBackground(mode.value)}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-[9px] transition-all border ${floorPlan.backgroundMode === mode.value ? 'border-[#25439b] bg-[#25439b]/[0.06] text-[#25439b] font-medium' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                <span className="text-sm">{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f && onUploadDiagram) onUploadDiagram(f); e.target.value = ''; }} />
          {floorPlan.floorDiagramImageUrl ? (
            <div className="space-y-2">
              <div className="relative">
                <img src={floorPlan.floorDiagramImageUrl} alt="Floor plan" className="w-full h-16 object-contain rounded-lg border border-slate-100" />
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity bg-black/5 rounded-lg">
                  <button onClick={() => fileRef.current?.click()} className="px-2 py-1 bg-white rounded text-[9px] font-medium shadow-sm">Replace</button>
                  <button onClick={onRemoveDiagram} className="px-2 py-1 bg-red-500 text-white rounded text-[9px] font-medium shadow-sm">Remove</button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1">
                <button onClick={() => onSetDiagramFit?.('contain')} className={`px-1.5 py-1 rounded border text-[9px] ${floorPlan.floorDiagramFitMode === 'contain' || !floorPlan.floorDiagramFitMode ? 'border-[#25439b] text-[#25439b] bg-[#25439b]/[0.06]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>Fit</button>
                <button onClick={() => onSetDiagramFit?.('cover')} className={`px-1.5 py-1 rounded border text-[9px] ${floorPlan.floorDiagramFitMode === 'cover' ? 'border-[#25439b] text-[#25439b] bg-[#25439b]/[0.06]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>Cover</button>
                <button onClick={() => onSetDiagramFit?.('fill')} className={`px-1.5 py-1 rounded border text-[9px] ${floorPlan.floorDiagramFitMode === 'fill' ? 'border-[#25439b] text-[#25439b] bg-[#25439b]/[0.06]' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>Stretch</button>
                <button onClick={onResetDiagramTransform} className="px-1.5 py-1 rounded border border-slate-100 text-[9px] text-slate-500 hover:border-slate-200">Reset</button>
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-2 border border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 hover:border-[#25439b]/50 hover:text-[#25439b] transition-colors">
              Upload Floor Image
            </button>
          )}
          {/* 360 Panorama Upload */}
          {onUpload360 && (
            <>
              <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pt-2">360 Panorama</h3>
              <input ref={panoramaFileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onUpload360(f); e.target.value = ''; }} />
              {floorPlan.panoramaUrl ? (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-sm">✅</span>
                  <span className="text-[10px] text-emerald-700 flex-1">360 image uploaded</span>
                  <button onClick={onPreview360} className="text-[9px] text-emerald-600 underline">View</button>
                  <button onClick={() => panoramaFileRef.current?.click()} className="text-[9px] text-emerald-600 underline">Replace</button>
                </div>
              ) : (
                <button onClick={() => panoramaFileRef.current?.click()}
                  className="w-full py-2 border border-dashed border-slate-200 rounded-lg text-[10px] text-slate-400 hover:border-[#25439b]/50 hover:text-[#25439b] transition-colors">
                  Upload 360 Image
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#25439b] transition-all placeholder:text-slate-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hasExistingPosTables && filteredUnplaced.length > 0 && (
          <div>
            <button onClick={() => setUnplacedExpanded(unplacedExpanded && !searchQuery ? false : !unplacedExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <span className="text-sm">📋</span>
              <span className="flex-1 text-left">Unplaced Tables</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#25439b] text-white text-[10px] font-bold">{filteredUnplaced.length}</span>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${(unplacedExpanded || searchQuery) ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            {(unplacedExpanded || searchQuery) && (
              <div className="p-2 space-y-1 bg-slate-50/30">
                {filteredUnplaced.map(table => (
                  <div
                    key={table.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('posTableId', String(table.id));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => onPlaceExistingTable?.(table.id)}
                    className="group flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 bg-white hover:border-[#25439b]/30 hover:bg-[#25439b]/[0.03] hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-150"
                    title={`Place ${table.name}`}
                  >
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50/80 group-hover:bg-[#25439b]/[0.06] transition-colors text-lg">
                      🪑
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-slate-700 truncate">{table.name}</div>
                      <div className="text-[9px] text-slate-400">Cap: {table.capacity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filteredCategories.map(cat => {
          const items = cat.filteredItems;
          const isExpanded = expandedCategory === cat.key || !!searchQuery;
          return (
            <div key={cat.key}>
              <button onClick={() => setExpandedCategory(isExpanded && !searchQuery ? null : cat.key)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-50">
                <span className="text-sm">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.label}</span>
                <span className="text-[10px] text-slate-400 mr-1">{items.length}</span>
                <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {isExpanded && (
                <div className="p-2 grid grid-cols-2 gap-1.5 bg-slate-50/30">
                  {items.map(item => <ObjectCard key={item.type} item={item} onAdd={() => onAddObject(item.type)} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
