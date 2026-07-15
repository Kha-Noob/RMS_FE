'use client';

import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { FloorPlan, FloorPlanObject } from '@/types';
import FloorPlanBackground from '@/components/FloorPlanBackground';
import { getContainScale, getFloorPlanStageSize } from '@/lib/floorPlanViewport';
import ObjectRenderer from './ObjectRenderer';

interface CanvasProps {
  floorPlan: FloorPlan;
  objects: FloorPlanObject[];
  selectedIds: number[];
  editMode: boolean;
  gridSize: number;
  snapToGrid: boolean;
  onSelectionChange: (ids: number[]) => void;
  onObjectMove: (id: number, x: number, y: number) => void;
  onObjectResize: (id: number, width: number, height: number) => void;
  onObjectRotate: (id: number, rotation: number) => void;
  onDrop: (type: string, x: number, y: number, posTableId?: number) => void;
  onZoomChange?: (zoom: number) => void;
}

export interface CanvasHandle {
  fitToScreen: () => number;
  zoomTo: (level: number) => void;
  getZoom: () => number;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas({
  floorPlan, objects, selectedIds, editMode, gridSize, snapToGrid,
  onSelectionChange, onObjectMove, onObjectResize, onObjectRotate, onDrop, onZoomChange,
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 1000, h: 700 });
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, camX: 0, camY: 0 });
  const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: number; handle: string; startX: number; startY: number; origW: number; origH: number } | null>(null);
  const [rotating, setRotating] = useState<{ id: number; startAngle: number; origRotation: number; centerX: number; centerY: number } | null>(null);
  const spaceHeldRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const stage = getFloorPlanStageSize(floorPlan, viewport.w, viewport.h);
  const stageWidth = stage.width;
  const stageHeight = stage.height;

  // Track viewport size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setViewport({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitToScreen = useCallback(() => {
    const padding = 32;
    const nextZoom = getContainScale(viewport.w, viewport.h, stageWidth, stageHeight, padding);
    setZoom(nextZoom);
    onZoomChange?.(nextZoom);
    setCamera({
      x: Math.max(16, (viewport.w - stageWidth * nextZoom) / 2),
      y: Math.max(16, (viewport.h - stageHeight * nextZoom) / 2),
    });
    return nextZoom;
  }, [onZoomChange, stageHeight, stageWidth, viewport]);

  const zoomTo = useCallback((l: number) => {
    const nextZoom = Math.max(0.05, Math.min(10, l));
    setZoom(nextZoom);
    onZoomChange?.(nextZoom);
  }, [onZoomChange]);
  const getZoom = useCallback(() => zoom, [zoom]);

  useImperativeHandle(ref, () => ({ fitToScreen, zoomTo, getZoom }), [fitToScreen, zoomTo, getZoom]);

  const snap = useCallback((v: number) => snapToGrid ? Math.round(v / gridSize) * gridSize : v, [snapToGrid, gridSize]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen, floorPlan.id]);

  // Object % coordinates map to floor plan pixels: x% means x% of the plan width.
  const screenToCanvas = useCallback((cx: number, cy: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const canvasX = (cx - r.left - camera.x) / zoom;
    const canvasY = (cy - r.top - camera.y) / zoom;
    return { x: (canvasX / stageWidth) * 100, y: (canvasY / stageHeight) * 100 };
  }, [zoom, camera, stageHeight, stageWidth]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    if (e.shiftKey) {
      setCamera(p => ({ x: p.x - e.deltaY, y: p.y }));
    } else {
      const d = (e.ctrlKey || e.metaKey ? 0.1 : 0.06) * (e.deltaY > 0 ? -1 : 1);
      const nz = Math.max(0.05, Math.min(10, zoom + d));
      const s = nz / zoom;
      setCamera(p => ({ x: mx - (mx - p.x) * s, y: my - (my - p.y) * s }));
      setZoom(nz);
      onZoomChange?.(nz);
    }
  }, [onZoomChange, zoom]);

  const capturePointer = (element: HTMLElement, pointerId: number) => {
    if (!element.hasPointerCapture(pointerId)) {
      element.setPointerCapture(pointerId);
    }
  };

  const releasePointer = (element: HTMLElement, pointerId: number) => {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const pan = e.button === 1 || e.button === 2 || (e.button === 0 && (e.altKey || spaceHeldRef.current));
    if (pan) {
      e.preventDefault(); e.stopPropagation();
      setIsPanning(true);
      panStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, camX: camera.x, camY: camera.y };
      capturePointer(e.currentTarget as HTMLElement, e.pointerId);
      return;
    }
    if (e.button === 0 && (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvasBg === 'true')) {
      onSelectionChange([]);
    }
  }, [camera, onSelectionChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isPanning) {
      setCamera({ x: panStartRef.current.camX + (e.clientX - panStartRef.current.mouseX), y: panStartRef.current.camY + (e.clientY - panStartRef.current.mouseY) });
      return;
    }
    if (dragging) {
      const p = screenToCanvas(e.clientX, e.clientY);
      onObjectMove(dragging.id, Math.max(0, Math.min(100, snap(p.x - dragging.offsetX))), Math.max(0, Math.min(100, snap(p.y - dragging.offsetY))));
      return;
    }
    if (resizing) {
      const p = screenToCanvas(e.clientX, e.clientY);
      const s = screenToCanvas(resizing.startX, resizing.startY);
      const dx = p.x - s.x; const dy = p.y - s.y; const h = resizing.handle;
      if (h.includes('e')) onObjectResize(resizing.id, Math.max(10, snap(resizing.origW + dx * 2)), resizing.origH);
      if (h.includes('s')) onObjectResize(resizing.id, resizing.origW, Math.max(10, snap(resizing.origH + dy * 2)));
      return;
    }
    if (rotating) {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const osx = rotating.centerX * zoom + camera.x + r.left;
      const osy = rotating.centerY * zoom + camera.y + r.top;
      const a = Math.atan2(e.clientY - osy, e.clientX - osx) * (180 / Math.PI);
      let nr = rotating.origRotation + (a - rotating.startAngle);
      if (e.shiftKey) nr = Math.round(nr / 15) * 15;
      onObjectRotate(rotating.id, Math.round(nr));
    }
  }, [isPanning, dragging, resizing, rotating, screenToCanvas, snap, onObjectMove, onObjectResize, onObjectRotate, zoom, camera]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    releasePointer(e.currentTarget as HTMLElement, e.pointerId);
    setIsPanning(false); setDragging(null); setResizing(null); setRotating(null);
  }, []);

  useEffect(() => { const el = containerRef.current; if (!el) return; const p = (e: WheelEvent) => { e.preventDefault(); e.stopPropagation(); }; el.addEventListener('wheel', p, { passive: false }); return () => el.removeEventListener('wheel', p); }, []);

  useEffect(() => {
    const d = (e: KeyboardEvent) => { if (e.code === 'Space' && !e.repeat) { const t = e.target as HTMLElement; if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return; e.preventDefault(); spaceHeldRef.current = true; setSpaceHeld(true); } };
    const u = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceHeldRef.current = false; setSpaceHeld(false); } };
    window.addEventListener('keydown', d); window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('objectType');
    const posTableIdStr = e.dataTransfer.getData('posTableId');
    const posTableId = posTableIdStr ? parseInt(posTableIdStr) : undefined;
    if (!type && !posTableId) return;
    const p = screenToCanvas(e.clientX, e.clientY);
    const dropType = type || 'round_table_4';
    onDrop(dropType, snap(p.x), snap(p.y), posTableId);
  }, [screenToCanvas, snap, onDrop]);

  const handleRotateStart = useCallback((e: React.PointerEvent, objId: number) => {
    e.stopPropagation(); e.preventDefault();
    const obj = objects.find(o => o.id === objId);
    if (!obj || obj.isLocked) return;
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const cx = (obj.x / 100) * stageWidth;
    const cy = (obj.y / 100) * stageHeight;
    const osx = cx * zoom + camera.x + r.left;
    const osy = cy * zoom + camera.y + r.top;
    setRotating({ id: objId, startAngle: Math.atan2(e.clientY - osy, e.clientX - osx) * (180 / Math.PI), origRotation: obj.rotation, centerX: cx, centerY: cy });
    capturePointer(e.currentTarget as HTMLElement, e.pointerId);
  }, [objects, stageHeight, stageWidth, zoom, camera]);

  const sortedObjects = [...objects].sort((a, b) => a.zIndex - b.zIndex);
  const cursorStyle = isPanning ? 'grabbing' : spaceHeld ? 'grab' : dragging ? 'grabbing' : rotating ? 'crosshair' : 'default';

  return (
    <div
      ref={containerRef}
      className="flex-1 relative min-h-0"
      style={{
        cursor: cursorStyle,
        overflow: 'auto',
        touchAction: 'none',
        userSelect: isPanning || dragging ? 'none' : undefined,
        overscrollBehavior: 'contain',
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Camera-transformed layer */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: stageWidth, height: stageHeight, transform: `translate(${camera.x}px, ${camera.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>

        {/* Background: fills entire viewport */}
        <div data-canvas-bg="true" style={{ position: 'absolute', left: 0, top: 0, width: stageWidth, height: stageHeight, zIndex: 0 }}>
          <FloorPlanBackground floorPlan={floorPlan} className="w-full h-full" />
        </div>

        {/* Grid: fills entire viewport */}
        {editMode && gridSize > 0 && (
          <div
            data-canvas-bg="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: stageWidth,
              height: stageHeight,
              backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
              backgroundSize: `${gridSize}px ${gridSize}px`,
              opacity: 0.25,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}

        {/* Objects: positioned as % of viewport — NO floorPlan rectangle */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: stageWidth, height: stageHeight, zIndex: 10 }}>
        {sortedObjects.map(obj => (
          <ObjectRenderer
            key={obj.id}
            object={obj}
            isEditor={true}
            isSelected={selectedIds.includes(obj.id)}
            onPointerDown={(e) => {
              if (!editMode || obj.isLocked) return;
              e.stopPropagation();
              if (e.shiftKey) {
                onSelectionChange(selectedIds.includes(obj.id) ? selectedIds.filter(id => id !== obj.id) : [...selectedIds, obj.id]);
              } else {
                onSelectionChange([obj.id]);
              }
              const p = screenToCanvas(e.clientX, e.clientY);
              setDragging({ id: obj.id, offsetX: p.x - obj.x, offsetY: p.y - obj.y });
              capturePointer(e.currentTarget as HTMLElement, e.pointerId);
            }}
            onResizeStart={(e, handle) => {
              if (obj.isLocked) return;
              e.stopPropagation();
              setResizing({ id: obj.id, handle, startX: e.clientX, startY: e.clientY, origW: obj.width, origH: obj.height });
              capturePointer(e.currentTarget as HTMLElement, e.pointerId);
            }}
            onRotateStart={(e) => handleRotateStart(e, obj.id)}
          />
        ))}
        </div>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md border border-slate-200 text-xs text-slate-600 font-medium pointer-events-none z-50">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
});

export default Canvas;
