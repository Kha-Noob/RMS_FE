'use client';

import React from 'react';
import type { FloorPlanObject } from '@/types';
import { getObjectSvg } from '@/components/svg-assets';
import { getObjectDefinition } from '@/components/object-registry';

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

interface ObjectRendererProps {
  object: FloorPlanObject;
  isEditor?: boolean;
  isSelected?: boolean;
  isPreview?: boolean;
  showHidden?: boolean;
  floorPlanWidth?: number;
  floorPlanHeight?: number;
  onPointerDown?: (e: React.PointerEvent) => void;
  onResizeStart?: (e: React.PointerEvent, handle: string) => void;
  onRotateStart?: (e: React.PointerEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export default function ObjectRenderer({
  object: obj,
  isEditor = false,
  isSelected = false,
  isPreview = false,
  showHidden = false,
  floorPlanWidth,
  floorPlanHeight,
  onPointerDown,
  onResizeStart,
  onRotateStart,
  onClick,
}: ObjectRendererProps) {
  if (obj.isVisible === false && !showHidden && !isEditor) return null;

  const style = asJsonObject(obj.styleJson);
  const meta = asJsonObject(obj.metadataJson);
  const SvgComp = getObjectSvg(obj.objectType);
  const def = getObjectDefinition(obj.objectType);
  const isCircle = obj.shape === 'circle';
  const isTable = def?.isTable || obj.objectType === 'table';
  const hasSvg = !!SvgComp;

  const posTable = (obj as unknown as Record<string, unknown>).posTable as
    { id: number; name: string; status: string; capacity: number; activeSessionId: number | null } | undefined;

  const statusColor = posTable
    ? posTable.status === 'EMPTY' ? '#22c55e'
      : posTable.status === 'OCCUPIED' ? '#ef4444'
      : posTable.status === 'RESERVED' ? '#f59e0b'
      : '#94a3b8'
    : null;

  const fillColor = isTable && isPreview ? '#8B6914' : jsonString(style.fillColor, '#808080');
  const strokeColor = isTable && isPreview ? '#5C4A1E' : jsonString(style.strokeColor, '#666');
  const opacity = jsonNumber(style.opacity, 1);

  const cursorClass = isEditor
    ? obj.isLocked ? 'cursor-not-allowed' : 'cursor-move'
    : onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`absolute ${cursorClass}`}
      style={{
        left: `${obj.x}%`,
        top: `${obj.y}%`,
        width: obj.width,
        height: obj.height,
        transform: `translate(-50%, -50%) rotate(${obj.rotation}deg)`,
        zIndex: obj.zIndex,
        opacity,
        pointerEvents: (obj.isVisible === false && !isEditor) ? 'none' : undefined,
      }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      {/* Selection highlight */}
      {isSelected && (
        <div
          className="absolute -inset-1 rounded-lg pointer-events-none z-30"
          style={{
            border: '2px solid #25439b',
            boxShadow: '0 0 0 1px rgba(37,67,155,0.2), 0 4px 12px rgba(37,67,155,0.15)',
          }}
        />
      )}

      {/* Object content */}
      <div
        className="w-full h-full flex items-center justify-center relative overflow-hidden"
        style={{
          borderRadius: hasSvg ? '0' : (isCircle ? '50%' : '4px'),
          backgroundColor: hasSvg ? 'transparent' : fillColor,
          border: hasSvg ? 'none' : `2px solid ${strokeColor}`,
        }}
      >
        {/* POS table status indicator */}
        {isTable && statusColor && (
          <div
            className="absolute -inset-0.5 rounded-[inherit] pointer-events-none z-10"
            style={{
              boxShadow: `0 0 0 3px ${statusColor}40, 0 0 12px ${statusColor}30`,
              borderRadius: isCircle ? '50%' : '4px',
            }}
          />
        )}

        {/* SVG or fallback */}
        {hasSvg ? (
          <SvgComp width={obj.width} height={obj.height} fillColor={fillColor} strokeColor={strokeColor} />
        ) : (
          <span className="text-[10px] text-white font-bold select-none leading-tight text-center px-1">
            {obj.label || obj.objectType}
          </span>
        )}
      </div>

      {/* Label */}
      {obj.label && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-600 font-medium whitespace-nowrap bg-white/80 px-1.5 py-0.5 rounded pointer-events-none z-20">
          {obj.label}
        </div>
      )}

      {/* Rotate handle — FIX 5: 24px blue circle + dashed guide */}
      {isSelected && isEditor && !obj.isLocked && onRotateStart && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
          style={{ top: -44 }}
          onPointerDown={onRotateStart}
        >
          <div className="w-px h-6" style={{ borderLeft: '2px dashed #25439b' }} />
          <div
            className="w-6 h-6 rounded-full bg-[#25439b] border-2 border-white flex items-center justify-center shadow-md hover:bg-[#1c3580] transition-colors"
            style={{ cursor: 'grab' }}
          >
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </div>
        </div>
      )}

      {/* Resize handles */}
      {isSelected && isEditor && !obj.isLocked && onResizeStart && (
        <>
          {['nw', 'ne', 'sw', 'se'].map(h => (
            <div
              key={h}
              className="absolute w-3 h-3 bg-white border-2 border-[#25439b] rounded-sm z-40 shadow-sm"
              style={{
                top: h.includes('n') ? -6 : 'auto',
                bottom: h.includes('s') ? -6 : 'auto',
                left: h.includes('w') ? -6 : 'auto',
                right: h.includes('e') ? -6 : 'auto',
                cursor: h === 'nw' || h === 'se' ? 'nwse-resize' : 'nesw-resize',
              }}
              onPointerDown={(e) => onResizeStart(e, h)}
            />
          ))}
        </>
      )}

      {/* Lock icon */}
      {isEditor && obj.isLocked && (
        <div className="absolute -top-3 -right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center z-40 shadow-sm">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
        </div>
      )}
    </div>
  );
}
