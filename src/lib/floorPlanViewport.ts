import type { FloorPlan } from '@/types';

export interface FloorPlanStageSize {
  width: number;
  height: number;
}

export function getFloorPlanStageSize(
  floorPlan: Pick<FloorPlan, 'width' | 'height'>,
  fallbackWidth = 1000,
  fallbackHeight = 800
): FloorPlanStageSize {
  return {
    width: Math.max(1, floorPlan.width || fallbackWidth),
    height: Math.max(1, floorPlan.height || fallbackHeight),
  };
}

export function getContainScale(
  viewportWidth: number,
  viewportHeight: number,
  stageWidth: number,
  stageHeight: number,
  padding = 0,
  maxScale = 1
): number {
  const availableWidth = Math.max(1, viewportWidth - padding);
  const availableHeight = Math.max(1, viewportHeight - padding);
  return Math.max(
    0.05,
    Math.min(availableWidth / stageWidth, availableHeight / stageHeight, maxScale)
  );
}

export function getWidthScale(
  viewportWidth: number,
  stageWidth: number,
  maxScale = 1
): number {
  return Math.max(0.05, Math.min(maxScale, Math.max(1, viewportWidth) / stageWidth));
}
