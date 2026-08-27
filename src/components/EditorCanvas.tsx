import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useElementSize } from '@mantine/hooks';
import Konva from 'konva';
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { useEditorStore } from '../store/editor';
import type { ResolveContext, } from '../lib/template';
import { analyzeBindings, resolveTemplateText } from '../lib/template';
import { applyAnchorOffset, textNodeConfig } from '../lib/render';
import {
  horizontalResizeHandles,
  reanchorPoint,
  snapResizeWidth,
  usesCenteredResize,
  type HorizontalResizeHandle,
} from '../lib/text-resize';
import type { TextLayer } from '../model';

function useHtmlImage(url: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useLayoutEffect(() => {
    let active = true;
    const next = new Image();
    next.decoding = 'async';
    next.src = url;
    void next.decode().then(() => { if (active) setImage(next); });
    return () => { active = false; };
  }, [url]);
  return image;
}

interface CanvasTextProps {
  layer: TextLayer;
  text: string;
  selected: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onGuide: (x: number | null, y: number | null) => void;
  targetsX: number[];
  targetsY: number[];
  scale: number;
}

const SNAP_PX = 7;

function nearestSnap(sources: number[], targets: number[], threshold: number) {
  let result: { delta: number; target: number } | null = null;
  let distance = threshold + 1;
  for (const source of sources) {
    for (const target of targets) {
      const delta = target - source;
      const nextDistance = Math.abs(delta);
      if (nextDistance <= threshold && nextDistance < distance) {
        result = { delta, target };
        distance = nextDistance;
      }
    }
  }
  return result;
}

function CanvasText({
  layer, text, selected, canvasWidth, canvasHeight, onSelect, onMove, onGuide,
  targetsX, targetsY, scale,
}: CanvasTextProps) {
  const nodeRef = useRef<Konva.Text>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const anchorMarkerRef = useRef<Konva.Group>(null);
  const resizeWidthRef = useRef<number | null>(null);
  const lastHandlePressRef = useRef<{ handle: HorizontalResizeHandle; time: number } | null>(null);
  const previousAnchorRef = useRef({ x: layer.anchorX, y: layer.anchorY });
  const canvas = useMemo(() => ({ width: canvasWidth, height: canvasHeight, padding: 0 }), [canvasWidth, canvasHeight]);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const previousAnchor = previousAnchorRef.current;
    const nextAnchor = { x: layer.anchorX, y: layer.anchorY };
    let x = canvasWidth * layer.xPct / 100;
    let y = canvasHeight * layer.yPct / 100;

    if (previousAnchor.x !== nextAnchor.x || previousAnchor.y !== nextAnchor.y) {
      const nextPoint = reanchorPoint(
        { x, y },
        { width: node.width(), height: node.height() },
        previousAnchor,
        nextAnchor,
      );
      x = nextPoint.x;
      y = nextPoint.y;
      node.position({ x, y });
      previousAnchorRef.current = nextAnchor;
      useEditorStore.getState().updateLayer(layer.id, {
        xPct: x / canvasWidth * 100,
        yPct: y / canvasHeight * 100,
      });
    }

    applyAnchorOffset(node, layer);
    anchorMarkerRef.current?.position({ x, y });
    transformerRef.current?.forceUpdate();
    node.getLayer()?.batchDraw();
  }, [canvasHeight, canvasWidth, layer, text]);

  useLayoutEffect(() => {
    const transformer = transformerRef.current;
    const node = nodeRef.current;
    if (!transformer || !node || !selected) return;
    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [selected, layer.width]);

  const resizeWithoutStretching = (event?: Konva.KonvaEventObject<Event>) => {
    const node = nodeRef.current;
    const transformer = transformerRef.current;
    if (!node || !transformer) return;

    const calculatedWidth = Math.max(40, Math.min(20_000, node.width() * Math.abs(node.scaleX())));
    const activeHandle = transformer.getActiveAnchor() as HorizontalResizeHandle | null;
    const snapDisabled = event?.evt && 'altKey' in event.evt && event.evt.altKey === true;
    let nextWidth = calculatedWidth;

    if (event && activeHandle && !snapDisabled) {
      const sceneLayer = node.getLayer();
      const otherNodes = sceneLayer?.find('.invitation-text').filter((item) => item !== node) ?? [];
      const otherBounds = otherNodes.map((item) => item.getClientRect({ relativeTo: sceneLayer ?? undefined }));
      const allTargetsX = [
        ...targetsX,
        ...otherBounds.flatMap((bounds) => [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width]),
      ];
      const snapped = snapResizeWidth({
        anchorX: layer.anchorX,
        anchorPointX: canvasWidth * layer.xPct / 100,
        width: calculatedWidth,
        activeHandle,
        targets: allTargetsX,
        threshold: SNAP_PX / Math.max(scale, 0.01),
      });
      nextWidth = snapped.width;
      onGuide(snapped.guideX, null);
    } else {
      onGuide(null, null);
    }

    resizeWidthRef.current = nextWidth;
    node.scale({ x: 1, y: 1 });
    node.width(nextWidth);
    node.position({
      x: canvasWidth * layer.xPct / 100,
      y: canvasHeight * layer.yPct / 100,
    });
    applyAnchorOffset(node, { ...layer, width: nextWidth });
    transformer.forceUpdate();
    node.getLayer()?.batchDraw();
  };

  const finishTransform = () => {
    const node = nodeRef.current;
    const transformer = transformerRef.current;
    if (!node || !transformer) return;
    resizeWithoutStretching();
    const nextWidth = Math.round(resizeWidthRef.current ?? node.width());
    resizeWidthRef.current = null;
    node.width(nextWidth);
    applyAnchorOffset(node, { ...layer, width: nextWidth });
    onGuide(null, null);
    useEditorStore.getState().updateLayer(layer.id, { width: nextWidth });
  };

  const resetWidthToContent = (event: Konva.KonvaEventObject<Event>) => {
    const handle = event.target.name().split(' ')[0] as HorizontalResizeHandle;
    if (layer.width === null || !horizontalResizeHandles(layer.anchorX).includes(handle)) return;
    event.cancelBubble = true;
    resizeWidthRef.current = null;
    onGuide(null, null);
    useEditorStore.getState().updateLayer(layer.id, { width: null });
  };

  const handleResizePress = (event: Konva.KonvaEventObject<Event>) => {
    const handle = event.target.name().split(' ')[0] as HorizontalResizeHandle;
    if (!horizontalResizeHandles(layer.anchorX).includes(handle)) return;
    const time = performance.now();
    const previous = lastHandlePressRef.current;
    lastHandlePressRef.current = { handle, time };
    if (layer.width === null || !previous || previous.handle !== handle || time - previous.time > Konva.dblClickWindow) return;
    lastHandlePressRef.current = null;
    event.cancelBubble = true;
    transformerRef.current?.stopTransform();
    resetWidthToContent(event);
  };

  const handleSize = 10 / Math.max(scale, 0.01);

  return (
    <>
      <Text
        ref={nodeRef}
        {...textNodeConfig(layer, text, canvas)}
        onPointerDown={(event) => { event.cancelBubble = true; onSelect(); }}
        onDblClick={onSelect}
        onDragMove={(event) => {
          const node = event.target as Konva.Text;
          if (event.evt.altKey) {
            onGuide(null, null);
          } else {
            const threshold = SNAP_PX / Math.max(scale, 0.01);
            const sceneLayer = node.getLayer();
            const ownBounds = node.getClientRect({ relativeTo: sceneLayer ?? undefined });
            const otherNodes = sceneLayer?.find('.invitation-text').filter((item) => item !== node) ?? [];
            const otherBounds = otherNodes.map((item) => item.getClientRect({ relativeTo: sceneLayer ?? undefined }));
            const allTargetsX = [...targetsX, ...otherBounds.flatMap((bounds) => [bounds.x, bounds.x + bounds.width / 2, bounds.x + bounds.width])];
            const allTargetsY = [...targetsY, ...otherBounds.flatMap((bounds) => [bounds.y, bounds.y + bounds.height / 2, bounds.y + bounds.height])];
            const snapX = nearestSnap([ownBounds.x, ownBounds.x + ownBounds.width / 2, ownBounds.x + ownBounds.width], allTargetsX, threshold);
            const snapY = nearestSnap([ownBounds.y, ownBounds.y + ownBounds.height / 2, ownBounds.y + ownBounds.height], allTargetsY, threshold);
            if (snapX) node.x(node.x() + snapX.delta);
            if (snapY) node.y(node.y() + snapY.delta);
            onGuide(snapX?.target ?? null, snapY?.target ?? null);
          }
          anchorMarkerRef.current?.position({ x: node.x(), y: node.y() });
          node.getLayer()?.batchDraw();
        }}
        onDragEnd={(event) => {
          onGuide(null, null);
          anchorMarkerRef.current?.position({ x: event.target.x(), y: event.target.y() });
          onMove(event.target.x(), event.target.y());
        }}
        shadowColor={selected ? '#4a9eff' : undefined}
        shadowBlur={selected ? 2 / Math.max(scale, 0.01) : 0}
        shadowOpacity={selected ? 0.5 : 0}
      />
      {selected ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          flipEnabled={false}
          keepRatio={false}
          centeredScaling={usesCenteredResize(layer.anchorX)}
          enabledAnchors={horizontalResizeHandles(layer.anchorX)}
          anchorSize={handleSize}
          anchorCornerRadius={layer.width === null ? handleSize / 2 : 1.5 / Math.max(scale, 0.01)}
          anchorStyleFunc={(anchor) => {
            anchor.hitStrokeWidth(18 / Math.max(scale, 0.01));
            anchor.off('.fit-content');
            anchor.on('mousedown.fit-content touchstart.fit-content', handleResizePress);
          }}
          borderStroke="#5f9fd9"
          borderStrokeWidth={1 / Math.max(scale, 0.01)}
          anchorFill="#dceeff"
          anchorStroke="#4f9bd4"
          anchorStrokeWidth={1 / Math.max(scale, 0.01)}
          boundBoxFunc={(oldBox, newBox) => newBox.width < 40 ? oldBox : newBox}
          onTransformStart={() => { resizeWidthRef.current = null; onGuide(null, null); }}
          onTransform={resizeWithoutStretching}
          onTransformEnd={finishTransform}
        />
      ) : null}
      {selected ? (
        <Group
          ref={anchorMarkerRef}
          x={canvasWidth * layer.xPct / 100}
          y={canvasHeight * layer.yPct / 100}
          listening={false}
        >
          <Circle
            radius={4.5 / Math.max(scale, 0.01)}
            fill="#17120c"
            stroke="#efcc8e"
            strokeWidth={1.7 / Math.max(scale, 0.01)}
            listening={false}
          />
          <Circle
            radius={1.5 / Math.max(scale, 0.01)}
            fill="#efcc8e"
            listening={false}
          />
        </Group>
      ) : null}
    </>
  );
}

export function EditorCanvas() {
  const { ref, width: wrapWidth, height: wrapHeight } = useElementSize();
  const canvas = useEditorStore((state) => state.canvas);
  const background = useEditorStore((state) => state.background);
  const layers = useEditorStore((state) => state.layers);
  const selectedId = useEditorStore((state) => state.selectedId);
  const records = useEditorStore((state) => state.records);
  const importedSignature = useEditorStore((state) => state.importedSignature);
  const previewIndex = useEditorStore((state) => state.previewIndex);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const updateLayer = useEditorStore((state) => state.updateLayer);
  const image = useHtmlImage(background.url);
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const previewUuids = useRef(new Map<number, Map<string, string>>());
  const previewNow = useRef(new Date());

  const scale = Math.max(0.05, Math.min(
    (wrapWidth - 36) / canvas.width,
    (wrapHeight - 36) / canvas.height,
    1,
  ));
  const stageWidth = canvas.width * scale;
  const stageHeight = canvas.height * scale;
  const binding = analyzeBindings(layers);
  const hasImport = records.length > 0 && binding.signature === importedSignature;
  const activeRecordIndex = hasImport ? previewIndex : 0;
  if (!previewUuids.current.has(activeRecordIndex)) previewUuids.current.set(activeRecordIndex, new Map());
  const context: ResolveContext = {
    record: hasImport ? records[previewIndex] : null,
    index: hasImport ? previewIndex + 1 : 1,
    now: previewNow.current,
    uuidByLayer: previewUuids.current.get(activeRecordIndex),
  };

  const baseTargetsX = [0, canvas.padding, canvas.width / 2, canvas.width - canvas.padding, canvas.width];
  const baseTargetsY = [0, canvas.padding, canvas.height / 2, canvas.height - canvas.padding, canvas.height];

  return (
    <main className="canvas-shell" ref={ref}>
      <div className="canvas-frame" style={{ width: stageWidth, height: stageHeight }}>
        <Stage
          width={stageWidth}
          height={stageHeight}
          scaleX={scale}
          scaleY={scale}
          onPointerDown={(event) => {
            if (event.target === event.target.getStage()) selectLayer(null);
          }}
        >
          <Layer>
            {image ? <KonvaImage image={image} width={canvas.width} height={canvas.height} listening={false} /> : null}
            <Rect
              x={canvas.padding}
              y={canvas.padding}
              width={Math.max(0, canvas.width - canvas.padding * 2)}
              height={Math.max(0, canvas.height - canvas.padding * 2)}
              stroke="rgba(214, 173, 107, .58)"
              dash={[8 / scale, 6 / scale]}
              strokeWidth={1 / scale}
              listening={false}
            />
            {layers.map((layer) => (
              <CanvasText
                key={layer.id}
                layer={layer}
                text={resolveTemplateText(layer.text, context, layer.id)}
                selected={selectedId === layer.id}
                canvasWidth={canvas.width}
                canvasHeight={canvas.height}
                scale={scale}
                targetsX={[...baseTargetsX, ...layers.filter((item) => item.id !== layer.id).map((item) => item.xPct / 100 * canvas.width)]}
                targetsY={[...baseTargetsY, ...layers.filter((item) => item.id !== layer.id).map((item) => item.yPct / 100 * canvas.height)]}
                onSelect={() => selectLayer(layer.id)}
                onGuide={(x, y) => setGuide({ x, y })}
                onMove={(x, y) => updateLayer(layer.id, {
                  xPct: Math.max(0, Math.min(100, x / canvas.width * 100)),
                  yPct: Math.max(0, Math.min(100, y / canvas.height * 100)),
                })}
              />
            ))}
            {guide.x !== null ? (
              <Line points={[guide.x, 0, guide.x, canvas.height]} stroke="#56b9ff" strokeWidth={1 / scale} listening={false} />
            ) : null}
            {guide.y !== null ? (
              <Line points={[0, guide.y, canvas.width, guide.y]} stroke="#56b9ff" strokeWidth={1 / scale} listening={false} />
            ) : null}
          </Layer>
        </Stage>
      </div>
    </main>
  );
}
