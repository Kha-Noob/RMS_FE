import { useState, useCallback, useRef } from 'react';
import type { FloorPlanObject } from '@/types';

interface HistoryState {
  objects: FloorPlanObject[];
}

export function useCanvasHistory(initialObjects: FloorPlanObject[] = []) {
  const [objects, setObjects] = useState<FloorPlanObject[]>(initialObjects);
  const historyRef = useRef<HistoryState[]>([{ objects: initialObjects }]);
  const indexRef = useRef(0);

  const pushState = useCallback((newObjects: FloorPlanObject[]) => {
    setObjects(newObjects);
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push({ objects: newObjects });
    indexRef.current = historyRef.current.length - 1;
  }, []);

  const updateObjects = useCallback((updater: (prev: FloorPlanObject[]) => FloorPlanObject[]) => {
    setObjects(prev => {
      const next = updater(prev);
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
      historyRef.current.push({ objects: next });
      indexRef.current = historyRef.current.length - 1;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current--;
      setObjects(historyRef.current[indexRef.current].objects);
    }
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current++;
      setObjects(historyRef.current[indexRef.current].objects);
    }
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  const reset = useCallback((newObjects: FloorPlanObject[]) => {
    setObjects(newObjects);
    historyRef.current = [{ objects: newObjects }];
    indexRef.current = 0;
  }, []);

  return { objects, pushState, updateObjects, undo, redo, canUndo, canRedo, reset };
}
