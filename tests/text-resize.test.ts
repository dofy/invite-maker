import { describe, expect, it } from 'vitest';
import {
  horizontalResizeHandles,
  reanchorPoint,
  resolveResizeHandleRelease,
  snapResizeWidth,
  usesCenteredResize,
} from '../src/lib/text-resize';

describe('anchored text resizing', () => {
  it('expands right from a left anchor', () => {
    expect(horizontalResizeHandles('left')).toEqual(['middle-right']);
    expect(usesCenteredResize('left')).toBe(false);
  });

  it('expands on both sides from a center anchor', () => {
    expect(horizontalResizeHandles('center')).toEqual(['middle-left', 'middle-right']);
    expect(usesCenteredResize('center')).toBe(true);
  });

  it('expands left from a right anchor', () => {
    expect(horizontalResizeHandles('right')).toEqual(['middle-left']);
    expect(usesCenteredResize('right')).toBe(false);
  });

  it('moves the anchor without moving the text box', () => {
    expect(reanchorPoint(
      { x: 50, y: 40 },
      { width: 200, height: 100 },
      { x: 'left', y: 'top' },
      { x: 'right', y: 'bottom' },
    )).toEqual({ x: 250, y: 140 });
  });

  it('supports moving a centered anchor to an edge', () => {
    expect(reanchorPoint(
      { x: 150, y: 90 },
      { width: 200, height: 100 },
      { x: 'center', y: 'center' },
      { x: 'left', y: 'top' },
    )).toEqual({ x: 50, y: 40 });
  });

  it('snaps the moving edge of left and right anchored text', () => {
    expect(snapResizeWidth({
      anchorX: 'left', anchorPointX: 100, width: 193, activeHandle: 'middle-right',
      targets: [300], threshold: 8,
    })).toEqual({ width: 200, guideX: 300 });
    expect(snapResizeWidth({
      anchorX: 'right', anchorPointX: 500, width: 195, activeHandle: 'middle-left',
      targets: [300], threshold: 8,
    })).toEqual({ width: 200, guideX: 300 });
  });

  it('snaps either edge symmetrically around a center anchor', () => {
    expect(snapResizeWidth({
      anchorX: 'center', anchorPointX: 300, width: 190, activeHandle: 'middle-right',
      targets: [400], threshold: 8,
    })).toEqual({ width: 200, guideX: 400 });
    expect(snapResizeWidth({
      anchorX: 'center', anchorPointX: 300, width: 190, activeHandle: 'middle-left',
      targets: [200], threshold: 8,
    })).toEqual({ width: 200, guideX: 200 });
  });

  it('keeps the calculated width when no resize target is near', () => {
    expect(snapResizeWidth({
      anchorX: 'left', anchorPointX: 100, width: 180, activeHandle: 'middle-right',
      targets: [300], threshold: 7,
    })).toEqual({ width: 180, guideX: null });
  });

  it('resets fixed width only after two stationary clicks', () => {
    const first = resolveResizeHandleRelease({
      previous: null,
      handle: 'middle-right',
      time: 100,
      moved: false,
      fixedWidth: true,
      doubleClickWindow: 400,
    });
    expect(first).toEqual({ next: { handle: 'middle-right', time: 100 }, reset: false });
    expect(resolveResizeHandleRelease({
      previous: first.next,
      handle: 'middle-right',
      time: 300,
      moved: false,
      fixedWidth: true,
      doubleClickWindow: 400,
    })).toEqual({ next: null, reset: true });
  });

  it('does not treat consecutive resize drags as a double click', () => {
    expect(resolveResizeHandleRelease({
      previous: { handle: 'middle-right', time: 100 },
      handle: 'middle-right',
      time: 200,
      moved: true,
      fixedWidth: true,
      doubleClickWindow: 400,
    })).toEqual({ next: null, reset: false });
  });

  it('does not retain clicks while width follows content', () => {
    expect(resolveResizeHandleRelease({
      previous: { handle: 'middle-right', time: 100 },
      handle: 'middle-right',
      time: 200,
      moved: false,
      fixedWidth: false,
      doubleClickWindow: 400,
    })).toEqual({ next: null, reset: false });
  });
});
