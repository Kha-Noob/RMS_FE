'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { FloorPlan, FloorPlanObject, TableEntity } from '@/types';
import { BACKGROUND_MODES } from '@/types';
import { createDefaultObject, getObjectDefinition } from '@/components/object-registry';
import type { TableStyle } from '@/types';
import Canvas, { type CanvasHandle } from '@/components/layout-builder/Canvas';
import Toolbox from '@/components/layout-builder/Toolbox';
import PropertyPanel from '@/components/layout-builder/PropertyPanel';
import Toolbar from '@/components/layout-builder/Toolbar';
import CreateTableModal from '@/components/layout-builder/CreateTableModal';
import PannellumViewer from '@/components/PannellumViewer';
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

/** Maps tableStyle + capacity to the correct floor plan object type for SVG rendering */
function getTableObjectType(tableStyle: TableStyle | null | undefined, capacity: number): string {
  switch (tableStyle) {
    case 'SQUARE':
      return 'square_table_4';
    case 'RECTANGLE':
      return capacity <= 6 ? 'rectangle_table_6' : 'rectangle_table_8';
    case 'VIP':
      return 'vip_sofa';
    case 'ROUND':
    default:
      if (capacity <= 2) return 'round_table_2';
      if (capacity <= 4) return 'round_table_4';
      if (capacity <= 6) return 'round_table_6';
      return 'round_table_8';
  }
}

function asJsonObject(value: FloorPlanObject['metadataJson']): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return {}; }
  }
  return value;
}

function withLinkedTableAliases(metadataJson: FloorPlanObject['metadataJson']): Record<string, unknown> {
  const metadata = asJsonObject(metadataJson);
  const linkedTableId = metadata.tableEntityId ?? metadata.tableId ?? metadata.linkedTableId;
  if (linkedTableId != null) {
    metadata.tableEntityId = linkedTableId;
    metadata.tableId = linkedTableId;
  }
  return metadata;
}

export default function FloorPlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params.branchId as string;
  const floorPlanId = params.floorPlanId as string;

  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDiagram, setUploadingDiagram] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [show360Preview, setShow360Preview] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);

  // Table creation workflow state
  const [posTables, setPosTables] = useState<TableEntity[]>([]);
  const [hasExistingPosTables, setHasExistingPosTables] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingDropInfo, setPendingDropInfo] = useState<{ type: string; x: number; y: number } | null>(null);

  const { objects, updateObjects, undo, redo, canUndo, canRedo, reset } = useCanvasHistory();

  const loadFloorPlan = useCallback(async () => {
    try {
      const plan = await api.get<FloorPlan & { floorPlanObjects?: FloorPlanObject[] }>(`/api/floor-plans/${floorPlanId}`);
      console.debug('[FloorPlanEditor] GET floor plan response', plan);
      setFloorPlan(plan);
      const loadedObjects = plan.floorPlanObjects ?? await api.get<FloorPlanObject[]>(`/api/floor-plans/${floorPlanId}/objects`);
      console.debug('[FloorPlanEditor] hydrated objects for canvas', loadedObjects);
      reset(loadedObjects);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load floor plan'));
    }
  }, [floorPlanId, reset]);

  useEffect(() => { loadFloorPlan().finally(() => setLoading(false)); }, [loadFloorPlan]);

  // Load POS tables to auto-detect workflow
  useEffect(() => {
    api.get<TableEntity[]>('/api/pos/tables', { params: { branchId } })
      .then(tables => {
        setPosTables(tables);
        setHasExistingPosTables(tables.length > 0);
      })
      .catch(() => {
        setHasExistingPosTables(false);
      });
  }, [branchId]);

  const selectedObj = objects.find(o => o.id === selectedIds[0]) || null;
  const roomTables = floorPlan?.roomId
    ? posTables.filter(t => t.room?.id === floorPlan.roomId)
    : posTables;

  // Unplaced tables: POS tables whose id is NOT in any object's metadataJson.tableEntityId
  const placedTableIds = new Set(
    objects
      .map(o => {
        const meta = asJsonObject(o.metadataJson);
        return meta.tableEntityId as number | undefined;
      })
      .filter((id): id is number => id != null)
  );
  const unplacedTables = roomTables.filter(t => !placedTableIds.has(t.id));

  useKeyboardShortcuts({
    selectedIds, objects, editMode,
    onUpdate: updateObjects,
    onSelectionChange: setSelectedIds,
    onUndo: undo, onRedo: redo,
    canUndo, canRedo,
  });

  // ── Object CRUD ──────────────────────────────────────────

  const handleAddObject = useCallback((type: string) => {
    const def = getObjectDefinition(type);
    const isTable = def?.isTable;

    if (isTable && roomTables.length === 0) {
      // Case 1: New restaurant — show create modal
      setPendingDropInfo({ type, x: 50, y: 50 });
      setShowCreateModal(true);
      return;
    }

    // Non-table object or Case 2 (already has POS tables) — place directly
    const newObj = createDefaultObject(type, 50, 50);
    const maxId = Math.max(0, ...objects.map(o => o.id));
    const id = maxId + 1;
    updateObjects(prev => [...prev, { ...newObj, id }]);
    setSelectedIds([id]);
  }, [objects, updateObjects, roomTables.length]);

  const handleDrop = useCallback((type: string, x: number, y: number, posTableId?: number) => {
    if (posTableId) {
      // Case 2: Dragging an existing POS table onto canvas
      const posTable = roomTables.find(t => t.id === posTableId);
      if (!posTable) return;

      const tableType = getTableObjectType(posTable.tableStyle, posTable.capacity);

      const newObj = createDefaultObject(tableType, x, y);
      const meta = asJsonObject(newObj.metadataJson);
      meta.tableEntityId = posTableId;
      meta.capacity = posTable.capacity;
      meta.tableStyle = posTable.tableStyle || 'ROUND';
      const maxId = Math.max(0, ...objects.map(o => o.id));
      const id = maxId + 1;
      updateObjects(prev => [...prev, { ...newObj, id, label: posTable.name, metadataJson: meta }]);
      setSelectedIds([id]);
      return;
    }

    // Case 1: Dropping a table preset — check if we need modal
    const def = getObjectDefinition(type);
    const isTable = def?.isTable;

    if (isTable && roomTables.length === 0) {
      // New restaurant — show create modal
      setPendingDropInfo({ type, x, y });
      setShowCreateModal(true);
      return;
    }

    // Non-table object — place directly
    const newObj = createDefaultObject(type, x, y);
    const maxId = Math.max(0, ...objects.map(o => o.id));
    const id = maxId + 1;
    updateObjects(prev => [...prev, { ...newObj, id }]);
    setSelectedIds([id]);
  }, [objects, updateObjects, roomTables]);

  // Called when user clicks "Create" in the CreateTableModal
  const handleCreateTable = useCallback((data: { name: string; capacity: number; zone: string; notes: string; tableStyle: TableStyle }) => {
    if (!pendingDropInfo) return;

    const tableType = getTableObjectType(data.tableStyle, data.capacity);
    const newObj = createDefaultObject(tableType, pendingDropInfo.x, pendingDropInfo.y);
    const meta = asJsonObject(newObj.metadataJson);
    meta.capacity = data.capacity;
    meta.zone = data.zone;
    meta.notes = data.notes;
    meta.tableStyle = data.tableStyle;
    const maxId = Math.max(0, ...objects.map(o => o.id));
    const id = maxId + 1;
    updateObjects(prev => [...prev, { ...newObj, id, label: data.name, metadataJson: meta }]);
    setSelectedIds([id]);
    setShowCreateModal(false);
    setPendingDropInfo(null);
  }, [pendingDropInfo, objects, updateObjects]);

  const handlePlaceExistingTable = useCallback((tableId: number) => {
    const posTable = roomTables.find(t => t.id === tableId);
    if (!posTable) return;

    const tableType = getTableObjectType(posTable.tableStyle, posTable.capacity);

    const newObj = createDefaultObject(tableType, 50, 50);
    const meta = asJsonObject(newObj.metadataJson);
    meta.tableEntityId = tableId;
    meta.capacity = posTable.capacity;
    meta.tableStyle = posTable.tableStyle || 'ROUND';
    const maxId = Math.max(0, ...objects.map(o => o.id));
    const id = maxId + 1;
    updateObjects(prev => [...prev, { ...newObj, id, label: posTable.name, metadataJson: meta }]);
    setSelectedIds([id]);
  }, [objects, updateObjects, roomTables]);

  const handleObjectMove = useCallback((id: number, x: number, y: number) => {
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, x, y } : o));
  }, [updateObjects]);

  const handleObjectResize = useCallback((id: number, width: number, height: number) => {
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, width, height } : o));
  }, [updateObjects]);

  const handleObjectRotate = useCallback((id: number, rotation: number) => {
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, rotation } : o));
  }, [updateObjects]);

  const handleObjectUpdate = useCallback((id: number, field: string, value: unknown) => {
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  }, [updateObjects]);

  const handleDeleteObject = useCallback((id: number) => {
    updateObjects(prev => prev.filter(o => o.id !== id));
    setSelectedIds(prev => prev.filter(i => i !== id));
  }, [updateObjects]);

  const handleDuplicateObject = useCallback((id: number) => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return;
    const maxId = Math.max(0, ...objects.map(o => o.id));
    const newId = maxId + 1;
    updateObjects(prev => [...prev, { ...obj, id: newId, x: obj.x + 2, y: obj.y + 2, label: obj.label ? obj.label + ' copy' : null }]);
    setSelectedIds([newId]);
  }, [objects, updateObjects]);

  const handleBringFront = useCallback((id: number) => {
    const maxZ = Math.max(0, ...objects.map(o => o.zIndex));
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, zIndex: maxZ + 1 } : o));
  }, [objects, updateObjects]);

  const handleSendBack = useCallback((id: number) => {
    const minZ = Math.min(0, ...objects.map(o => o.zIndex));
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, zIndex: minZ - 1 } : o));
  }, [objects, updateObjects]);

  const handleBringForward = useCallback((id: number) => {
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, zIndex: o.zIndex + 1 } : o));
  }, [updateObjects]);

  const handleSendBackward = useCallback((id: number) => {
    updateObjects(prev => prev.map(o => o.id === id ? { ...o, zIndex: Math.max(0, o.zIndex - 1) } : o));
  }, [updateObjects]);

  const setCanvasZoom = useCallback((nextZoom: number) => {
    const clampedZoom = Math.max(0.05, Math.min(10, nextZoom));
    canvasRef.current?.zoomTo(clampedZoom);
    setZoom(clampedZoom);
  }, []);

  const handleFitToScreen = useCallback(() => {
    const fittedZoom = canvasRef.current?.fitToScreen();
    setZoom(fittedZoom ?? 1);
  }, []);

  // ── Save / Publish ──────────────────────────────────────

  const handleSave = async () => {
    if (!floorPlan) return false;
    if (uploadingDiagram) {
      toast.warning('Please wait for the floor plan image upload to finish before saving.');
      return false;
    }

    setSaving(true);
    try {
      console.debug('[FloorPlanEditor] objects state before Save', objects);

      const updatedPlan = await api.patch<FloorPlan>(`/api/floor-plans/${floorPlanId}`, {
        backgroundMode: floorPlan.backgroundMode,
        floorDiagramImageUrl: floorPlan.floorDiagramImageUrl,
        floorDiagramImageKey: floorPlan.floorDiagramImageKey ?? null,
        floorDiagramFitMode: floorPlan.floorDiagramFitMode ?? 'contain',
        floorDiagramX: floorPlan.floorDiagramX ?? 0,
        floorDiagramY: floorPlan.floorDiagramY ?? 0,
        floorDiagramWidth: floorPlan.floorDiagramWidth ?? 100,
        floorDiagramHeight: floorPlan.floorDiagramHeight ?? 100,
        floorDiagramScale: floorPlan.floorDiagramScale ?? 1,
        floorDiagramRotation: floorPlan.floorDiagramRotation ?? 0,
      });
      setFloorPlan(updatedPlan);

      const objectPayload = objects.map(o => {
        const metadataJson = withLinkedTableAliases(o.metadataJson);
        const linkedTableId = o.tableId ?? metadataJson.tableEntityId ?? metadataJson.tableId ?? metadataJson.linkedTableId ?? null;
        return {
          id: o.id,
          tableId: linkedTableId,
          objectType: o.objectType,
          label: o.label,
          x: Math.round(o.x * 10) / 10,
          y: Math.round(o.y * 10) / 10,
          width: Math.round(o.width),
          height: Math.round(o.height),
          rotation: Math.round(o.rotation),
          shape: o.shape,
          zIndex: o.zIndex,
          styleJson: asJsonObject(o.styleJson),
          metadataJson,
          isVisible: o.isVisible !== false,
          isLocked: !!o.isLocked,
        };
      });
      console.debug('[FloorPlanEditor] Save objects request payload', objectPayload);

      const savedObjects = await api.put<FloorPlanObject[]>(`/api/floor-plans/${floorPlanId}/objects/bulk`, objectPayload);
      console.debug('[FloorPlanEditor] Save objects API response', savedObjects);
      reset(savedObjects);
      toast.success('Draft saved');
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      const saved = await handleSave();
      if (!saved) return;
      await api.post(`/api/floor-plans/${floorPlanId}/publish`);
      setFloorPlan(prev => prev ? { ...prev, status: 'published' } : null);
      toast.success('Published! POS will now use this layout.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Publish failed'));
    }
  };

  // ── Background management ────────────────────────────────

  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateImageFile = (file: File): string | null => {
    if (file.size <= 0) {
      return 'Selected file is empty';
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Chỉ chấp nhận file ảnh: PNG, JPG, WebP, SVG';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be <= 10MB';
    }
    return null;
  };

  const resetDiagramTransform = {
    floorDiagramFitMode: 'contain' as const,
    floorDiagramX: 0,
    floorDiagramY: 0,
    floorDiagramWidth: 100,
    floorDiagramHeight: 100,
    floorDiagramScale: 1,
    floorDiagramRotation: 0,
  };

  const updateDiagramTransform = async (updates: Partial<FloorPlan>) => {
    setFloorPlan(prev => prev ? { ...prev, ...updates, backgroundMode: 'CUSTOM_IMAGE' } : prev);
    try {
      const updated = await api.patch<FloorPlan>(`/api/floor-plans/${floorPlanId}`, {
        ...updates,
        backgroundMode: 'CUSTOM_IMAGE',
      });
      setFloorPlan(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update floor image settings'));
      await loadFloorPlan();
    }
  };

  const handleUploadDiagram = async (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUploadingDiagram(true);
    try {
      const updated = await api.uploadFile<FloorPlan>(
        `/api/floor-plans/${floorPlanId}/upload-diagram`,
        file
      );
      setFloorPlan({ ...updated, ...resetDiagramTransform, backgroundMode: 'CUSTOM_IMAGE' });
      handleFitToScreen();
      toast.success('Floor plan uploaded successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to upload floor plan image.'));
      await loadFloorPlan();
    } finally {
      setUploadingDiagram(false);
    }
  };

  const handleUpload360 = async (file: File) => {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      const updated = await api.uploadFile<FloorPlan>(
        `/api/floor-plans/${floorPlanId}/upload-360`,
        file
      );
      setFloorPlan(updated);
      setShow360Preview(true);
      toast.success('360 panorama uploaded successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to upload 360 panorama.'));
    }
  };

  const handleRemoveDiagram = async () => {
    try {
      await api.patch(`/api/floor-plans/${floorPlanId}`, {
        floorDiagramImageUrl: null,
        floorDiagramImageKey: null,
        backgroundMode: 'DEFAULT_WOOD',
      });
      setFloorPlan(prev => prev ? {
        ...prev,
        floorDiagramImageUrl: null,
        floorDiagramImageKey: null,
        backgroundMode: 'DEFAULT_WOOD',
      } : null);
      toast.success('Floor plan removed');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to remove floor plan'));
    }
  };

  const handleChangeBackground = async (mode: string) => {
    try {
      await api.patch(`/api/floor-plans/${floorPlanId}`, { backgroundMode: mode });
      setFloorPlan(prev => prev ? { ...prev, backgroundMode: mode as FloorPlan['backgroundMode'] } : null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change background'));
    }
  };

  // ── Render ──────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#25439b] rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Loading floor plan...</span>
      </div>
    </div>
  );
  if (!floorPlan) return <div className="text-center py-12 text-slate-500">Floor plan not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] bg-slate-50">
      <Toolbar
        floorPlanName={floorPlan.name}
        floorNumber={floorPlan.floorNumber}
        roomName={floorPlan.room?.name}
        status={floorPlan.status}
        objectCount={objects.length}
        editMode={editMode}
        gridSize={gridSize}
        snapToGrid={snapToGrid}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleEditMode={() => setEditMode(!editMode)}
        onToggleGrid={() => setGridSize(gridSize > 0 ? 0 : 20)}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onGridSizeChange={setGridSize}
        onZoomIn={() => setCanvasZoom((canvasRef.current?.getZoom() ?? zoom) + 0.1)}
        onZoomOut={() => setCanvasZoom((canvasRef.current?.getZoom() ?? zoom) - 0.1)}
        onZoomReset={() => setCanvasZoom(1)}
        onFitToScreen={handleFitToScreen}
        zoom={zoom}
        onUndo={undo}
        onRedo={redo}
        onBack={() => router.push(`/branches/${branchId}/floor-plans`)}
        onSave={handleSave}
        saving={saving}
        onPublish={floorPlan.status === 'draft' ? handlePublish : undefined}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {editMode && (
          <Toolbox
            onAddObject={handleAddObject}
            floorPlan={floorPlan}
            onChangeBackground={handleChangeBackground}
            onUploadDiagram={handleUploadDiagram}
            onRemoveDiagram={handleRemoveDiagram}
            onSetDiagramFit={(mode) => updateDiagramTransform({ ...resetDiagramTransform, floorDiagramFitMode: mode })}
            onResetDiagramTransform={() => updateDiagramTransform(resetDiagramTransform)}
            onUpload360={handleUpload360}
            onPreview360={() => {
              if (floorPlan.panoramaUrl) setShow360Preview(true);
              else toast.warning('Upload a 360 image first');
            }}
            hasExistingPosTables={roomTables.length > 0}
            unplacedTables={unplacedTables}
            onPlaceExistingTable={handlePlaceExistingTable}
          />
        )}

        <Canvas
          ref={canvasRef}
          floorPlan={floorPlan}
          objects={objects}
          selectedIds={selectedIds}
          editMode={editMode}
          gridSize={gridSize || 20}
          snapToGrid={snapToGrid}
          onSelectionChange={setSelectedIds}
          onObjectMove={handleObjectMove}
          onObjectResize={handleObjectResize}
          onObjectRotate={handleObjectRotate}
          onDrop={handleDrop}
          onZoomChange={setZoom}
        />

        {editMode && (
          <PropertyPanel
            object={selectedObj}
            objects={objects}
            floorPlanStatus={floorPlan.status}
            onUpdate={handleObjectUpdate}
            onDelete={handleDeleteObject}
            onDuplicate={handleDuplicateObject}
            onBringFront={handleBringFront}
            onSendBack={handleSendBack}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
          />
        )}

        {!editMode && !selectedObj && (
          <div className="w-72 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Floor Plan Image</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  {floorPlan.floorDiagramImageUrl ? (
                    <img src={floorPlan.floorDiagramImageUrl} alt="Floor plan" className="w-full h-32 object-contain" />
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">No floor plan uploaded</div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Floor Background</h4>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_MODES.map(mode => (
                    <div key={mode.value}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-xs border ${floorPlan.backgroundMode === mode.value ? 'border-[#25439b] bg-[#25439b]/[0.06] text-[#25439b] font-medium' : 'border-slate-100 bg-white text-slate-600'}`}>
                      <span className="text-base">{mode.icon}</span>
                      <span>{mode.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {show360Preview && floorPlan.panoramaUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={() => setShow360Preview(false)}>
          <button
            onClick={() => setShow360Preview(false)}
            className="absolute top-4 right-4 text-white text-xl z-10 bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center"
          >
            x
          </button>
          <div className="w-[95vw] h-[90vh] rounded-xl overflow-hidden bg-slate-950" onClick={e => e.stopPropagation()}>
            <PannellumViewer imageUrl={floorPlan.panoramaUrl} className="w-full h-full rounded-xl" />
          </div>
        </div>
      )}

      <CreateTableModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setPendingDropInfo(null); }}
        onCreate={handleCreateTable}
        defaultName={`Bàn ${objects.filter(o => getObjectDefinition(o.objectType)?.isTable).length + 1}`}
        defaultCapacity={pendingDropInfo ? (getObjectDefinition(pendingDropInfo.type)?.defaultMetadata as Record<string, unknown>)?.capacity as number || 4 : 4}
        defaultStyle="ROUND"
      />
    </div>
  );
}
