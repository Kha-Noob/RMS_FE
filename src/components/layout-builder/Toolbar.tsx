'use client';

interface ToolbarProps {
  floorPlanName: string;
  floorNumber: number;
  roomName?: string | null;
  status: string;
  objectCount: number;
  editMode: boolean;
  gridSize: number;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToggleEditMode: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onGridSizeChange: (size: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToScreen?: () => void;
  zoom: number;
  onUndo: () => void;
  onRedo: () => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  onPublish?: () => void;
}

export default function Toolbar({
  floorPlanName, floorNumber, roomName, status, objectCount, editMode,
  gridSize, snapToGrid, canUndo, canRedo,
  onToggleEditMode, onToggleGrid, onToggleSnap, onGridSizeChange,
  onZoomIn, onZoomOut, onZoomReset, onFitToScreen, zoom,
  onUndo, onRedo, onBack, onSave, saving, onPublish,
}: ToolbarProps) {
  return (
    <div className="h-12 bg-white border-b border-slate-200 flex items-center px-2 gap-1 text-xs shadow-sm">
      {/* Back */}
      <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Back">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
      </button>
      <div className="w-px h-5 bg-slate-200" />

      {/* Plan info */}
      <div className="flex items-center gap-2 px-2">
        <span className="font-semibold text-slate-700 text-sm">{floorPlanName}</span>
        <span className="text-slate-300">|</span>
        <span className="text-slate-500">{roomName || `Floor ${floorNumber}`}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {status === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>
      <div className="w-px h-5 bg-slate-200" />

      {/* Grid controls */}
      <div className="flex items-center gap-1 px-1">
        <button onClick={onToggleGrid}
          className={`p-1.5 rounded-lg transition-colors ${gridSize > 0 ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-50'}`}
          title="Toggle grid">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
        <select value={gridSize} onChange={e => onGridSizeChange(parseInt(e.target.value))}
          className="text-[10px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-1 outline-none">
          <option value={10}>10px</option>
          <option value={20}>20px</option>
          <option value={50}>50px</option>
        </select>
        <label className="flex items-center gap-1 cursor-pointer px-1.5 py-1 rounded-lg hover:bg-slate-50 transition-colors">
          <input type="checkbox" checked={snapToGrid} onChange={onToggleSnap} className="w-3 h-3 rounded border-slate-300" />
          <span className="text-[10px] text-slate-600">Snap</span>
        </label>
      </div>
      <div className="w-px h-5 bg-slate-200" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5 px-1">
        <button onClick={onZoomOut} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" title="Zoom out">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <span className="w-12 text-center text-[10px] font-medium text-slate-600">{Math.round(zoom * 100)}%</span>
        <button onClick={onZoomIn} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" title="Zoom in">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
        <button onClick={onZoomReset} className="px-1.5 py-1 rounded-lg hover:bg-slate-100 text-[10px] text-slate-600 transition-colors" title="Reset zoom">Reset</button>
        {onFitToScreen && (
          <button onClick={onFitToScreen} className="px-1.5 py-1 rounded-lg hover:bg-slate-100 text-[10px] text-slate-600 transition-colors" title="Fit to screen">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          </button>
        )}
      </div>
      <div className="w-px h-5 bg-slate-200" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 px-1">
        <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors" title="Undo (Ctrl+Z)">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 0 1 0 10H9" /><path d="M3 10l4-4M3 10l4 4" /></svg>
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 transition-colors" title="Redo (Ctrl+Y)">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10H11a5 5 0 0 0 0 10h4" /><path d="M21 10l-4-4M21 10l-4 4" /></svg>
        </button>
      </div>

      <div className="flex-1" />

      {/* Object count */}
      <span className="text-[10px] text-slate-400 px-2">{objectCount} objects</span>
      <div className="w-px h-5 bg-slate-200" />

      {/* Edit / Preview toggle */}
      <button onClick={onToggleEditMode}
        className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${editMode ? 'bg-amber-500 text-white shadow-sm' : 'bg-[#25439b] text-white hover:bg-[#1c3580] shadow-sm'}`}>
        {editMode ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Preview
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit
          </span>
        )}
      </button>

      {/* Save */}
      <button onClick={onSave} disabled={saving}
        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium text-xs hover:bg-slate-200 disabled:opacity-50 transition-colors flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
        {saving ? 'Saving...' : 'Save'}
      </button>

      {/* Publish */}
      {onPublish !== undefined && (
        <button onClick={onPublish}
          className="px-3 py-1.5 bg-[#25439b] text-white rounded-lg font-medium text-xs hover:bg-[#1c3580] transition-colors shadow-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            Publish
          </span>
        </button>
      )}
    </div>
  );
}
