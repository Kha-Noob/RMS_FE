import { useEffect, useCallback } from 'react';
import type { FloorPlanObject } from '@/types';
import { createDefaultObject } from '@/components/object-registry';

interface UseKeyboardShortcutsProps {
  selectedIds: number[];
  objects: FloorPlanObject[];
  editMode: boolean;
  onUpdate: (updater: (prev: FloorPlanObject[]) => FloorPlanObject[]) => void;
  onSelectionChange: (ids: number[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useKeyboardShortcuts({
  selectedIds, objects, editMode, onUpdate, onSelectionChange, onUndo, onRedo, canUndo, canRedo
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editMode) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    // Delete
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedIds.length > 0) {
        e.preventDefault();
        onUpdate(prev => prev.filter(o => !selectedIds.includes(o.id)));
        onSelectionChange([]);
      }
      return;
    }

    // Ctrl+Z: Undo
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      if (canUndo) onUndo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z: Redo
    if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
      e.preventDefault();
      if (canRedo) onRedo();
      return;
    }

    // Ctrl+D: Duplicate
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (selectedIds.length > 0) {
        const newObjects: FloorPlanObject[] = [];
        let maxId = Math.max(0, ...objects.map(o => o.id));
        selectedIds.forEach(id => {
          const obj = objects.find(o => o.id === id);
          if (obj) {
            maxId++;
              newObjects.push({
              ...obj,
              id: maxId,
              x: obj.x + 20,
              y: obj.y + 20,
              label: obj.label ? obj.label + ' copy' : null,
            });
          }
        });
        onUpdate(prev => [...prev, ...newObjects]);
        onSelectionChange(newObjects.map(o => o.id));
      }
      return;
    }

    // Ctrl+C: Copy
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      if (selectedIds.length > 0) {
        const selected = objects.filter(o => selectedIds.includes(o.id));
        try { navigator.clipboard.writeText(JSON.stringify(selected)); } catch {}
      }
      return;
    }

    // Ctrl+V: Paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      try {
        navigator.clipboard.readText().then(text => {
          try {
            const parsed = JSON.parse(text) as FloorPlanObject[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              let maxId = Math.max(0, ...objects.map(o => o.id));
              const pasted = parsed.map(obj => {
                maxId++;
                return { ...obj, id: maxId, x: obj.x + 30, y: obj.y + 30 };
              });
              onUpdate(prev => [...prev, ...pasted]);
              onSelectionChange(pasted.map(o => o.id));
            }
          } catch {}
        });
      } catch {}
      return;
    }

    // Arrow keys: nudge
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
      const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;
      onUpdate(prev => prev.map(o => selectedIds.includes(o.id)
        ? { ...o, x: o.x + dx, y: o.y + dy } : o
      ));
      return;
    }
  }, [editMode, selectedIds, objects, onUpdate, onSelectionChange, onUndo, onRedo, canUndo, canRedo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
