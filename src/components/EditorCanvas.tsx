import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useElementSize } from '@mantine/hooks';
import Konva from 'konva';
import { Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { useEditorStore } from '../store/editor';
import type { ResolveContext, } from '../lib/template';
import { analyzeBindings, resolveTemplateText } from '../lib/template';
import { applyAnchorOffset, textNodeConfig } from '../lib/render';
import { backgroundFromFile, releaseBackground } from '../lib/image-file';
import { notifications } from '@mantine/notifications';
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
  const canvas = useMemo(() => ({ width: canvasWidth, height: canvasHeight, padding: 0 }), [canvasWidth, canvasHeight]);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    applyAnchorOffset(node, layer);
    node.getLayer()?.batchDraw();
  }, [layer, text]);

  useLayoutEffect(() => {
    const transformer = transformerRef.current;
    const node = nodeRef.current;
    if (!transformer || !node || !selected) return;
    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [selected, layer.width]);

  const finishTransform = () => {
    const node = nodeRef.current;
    const transformer = transformerRef.current;
    if (!node || !transformer) return;
    const activeAnchor = transformer.getActiveAnchor() ?? '';
    const scaleX = Math.abs(node.scaleX());
    const scaleY = Math.abs(node.scaleY());
    node.scale({ x: 1, y: 1 });
    if (activeAnchor.includes('middle') && layer.width !== null) {
      onMove(node.x(), node.y());
      useEditorStore.getState().updateLayer(layer.id, { width: Math.max(40, layer.width * scaleX) });
    } else {
      const factor = Math.max(0.2, Math.min(8, (scaleX + scaleY) / 2));
      useEditorStore.getState().updateLayer(layer.id, { size: Math.max(8, Math.min(2_000, layer.size * factor)) });
    }
  };

  return (
    <>
      <Text
        ref={nodeRef}
        {...textNodeConfig(layer, text, canvas)}
        onPointerDown={(event) => { event.cancelBubble = true; onSelect(); }}
        onDblClick={onSelect}
        onDragMove={(event) => {
          const node = event.target as Konva.Text;
          if (event.evt.altKey) { onGuide(null, null); return; }
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
        }}
        onDragEnd={(event) => {
          onGuide(null, null);
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
          keepRatio={layer.width === null}
          enabledAnchors={layer.width === null
            ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
            : ['middle-left', 'middle-right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorSize={12 / Math.max(scale, 0.01)}
          borderStroke="#4a9eff"
          borderStrokeWidth={1.5 / Math.max(scale, 0.01)}
          anchorFill="#e7f2ff"
          anchorStroke="#4a9eff"
          anchorStrokeWidth={1.5 / Math.max(scale, 0.01)}
          boundBoxFunc={(oldBox, newBox) => newBox.width < 40 ? oldBox : newBox}
          onTransformEnd={finishTransform}
        />
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
  const setBackground = useEditorStore((state) => state.setBackground);
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
    <main
      className="canvas-shell"
      ref={ref}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) return;
        void backgroundFromFile(file).then((next) => {
          releaseBackground(background);
          setBackground(next);
          notifications.show({ color: 'green', title: '底图已载入', message: `${next.naturalWidth} × ${next.naturalHeight}px` });
        }).catch((error: unknown) => notifications.show({
          color: 'red', title: '底图载入失败', message: error instanceof Error ? error.message : '请选择有效图片',
        }));
      }}
    >
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
        {background.isPlaceholder ? (
          <button className="placeholder-action" type="button" onClick={() => document.getElementById('background-file')?.click()}>
            点击上传邀请函底图
          </button>
        ) : null}
      </div>
    </main>
  );
}
