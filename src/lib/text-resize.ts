import type { AnchorX, AnchorY } from '../model';
import { anchorOffsetX, anchorOffsetY } from './render';

export type HorizontalResizeHandle = 'middle-left' | 'middle-right';

export interface ResizeHandleClick {
  handle: HorizontalResizeHandle;
  time: number;
}

interface ResizeHandleReleaseOptions {
  previous: ResizeHandleClick | null;
  handle: HorizontalResizeHandle;
  time: number;
  moved: boolean;
  fixedWidth: boolean;
  doubleClickWindow: number;
}

/** Distinguish a deliberate double click from two resize drags close together. */
export function resolveResizeHandleRelease({
  previous,
  handle,
  time,
  moved,
  fixedWidth,
  doubleClickWindow,
}: ResizeHandleReleaseOptions): { next: ResizeHandleClick | null; reset: boolean } {
  if (moved || !fixedWidth) return { next: null, reset: false };
  if (previous && previous.handle === handle && time - previous.time <= doubleClickWindow) {
    return { next: null, reset: true };
  }
  return { next: { handle, time }, reset: false };
}

interface ResizeSnapOptions {
  anchorX: AnchorX;
  anchorPointX: number;
  width: number;
  activeHandle: HorizontalResizeHandle;
  targets: number[];
  threshold: number;
  minWidth?: number;
  maxWidth?: number;
}

interface ResizeSnapResult {
  width: number;
  guideX: number | null;
}

export function horizontalResizeHandles(anchorX: AnchorX): HorizontalResizeHandle[] {
  if (anchorX === 'left') return ['middle-right'];
  if (anchorX === 'right') return ['middle-left'];
  return ['middle-left', 'middle-right'];
}

export function usesCenteredResize(anchorX: AnchorX) {
  return anchorX === 'center';
}

/** Snap the moving edge while preserving the current horizontal anchor. */
export function snapResizeWidth({
  anchorX,
  anchorPointX,
  width,
  activeHandle,
  targets,
  threshold,
  minWidth = 40,
  maxWidth = 20_000,
}: ResizeSnapOptions): ResizeSnapResult {
  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
  const direction = anchorX === 'left' || (anchorX === 'center' && activeHandle === 'middle-right') ? 1 : -1;
  const distanceFromAnchor = anchorX === 'center' ? clampedWidth / 2 : clampedWidth;
  const movingEdgeX = anchorPointX + direction * distanceFromAnchor;

  let nearestTarget: number | null = null;
  let nearestDistance = threshold + 1;
  for (const target of targets) {
    const distance = Math.abs(target - movingEdgeX);
    if (distance <= threshold && distance < nearestDistance) {
      nearestTarget = target;
      nearestDistance = distance;
    }
  }
  if (nearestTarget === null) return { width: clampedWidth, guideX: null };

  const snappedWidth = Math.abs(nearestTarget - anchorPointX) * (anchorX === 'center' ? 2 : 1);
  if (snappedWidth < minWidth || snappedWidth > maxWidth) {
    return { width: clampedWidth, guideX: null };
  }
  return { width: snappedWidth, guideX: nearestTarget };
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Anchor {
  x: AnchorX;
  y: AnchorY;
}

/** Move the anchor while keeping the text box's top-left corner unchanged. */
export function reanchorPoint(point: Point, size: Size, from: Anchor, to: Anchor): Point {
  return {
    x: point.x - anchorOffsetX(from.x, size.width) + anchorOffsetX(to.x, size.width),
    y: point.y - anchorOffsetY(from.y, size.height) + anchorOffsetY(to.y, size.height),
  };
}
