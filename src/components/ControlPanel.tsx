import { useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Button,
  ColorInput,
  Group,
  Modal,
  NumberInput,
  Progress,
  ScrollArea,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCalendar,
  IconClock,
  IconCode,
  IconDatabase,
  IconDownload,
  IconFileDescription,
  IconFileImport,
  IconFileZip,
  IconFingerprint,
  IconHash,
  IconImageInPicture,
  IconStack,
  IconPhotoUp,
  IconPlus,
  IconTableColumn,
  IconTrash,
  IconTypography,
} from '@tabler/icons-react';
import type { AnchorX, AnchorY, HorizontalAlign, TextLayer } from '../model';
import { analyzeBindings } from '../lib/template';
import { importDataFile } from '../lib/data';
import { buildTemplate, parseTemplateFile } from '../lib/template-json';
import { downloadBlob, renderBatchZip, renderInvitationBlob } from '../lib/render';
import { backgroundFromFile, releaseBackground } from '../lib/image-file';
import { useEditorStore } from '../store/editor';

const FONT_OPTIONS = [
  { group: '系统字体 · System', items: [
    { value: '"PingFang SC","Microsoft YaHei",sans-serif', label: '系统黑体' },
    { value: '"Songti SC","SimSun",serif', label: '系统宋体' },
    { value: '"Kaiti SC","KaiTi",serif', label: '系统楷体' },
    { value: 'Georgia,serif', label: 'Georgia' },
    { value: '"Helvetica Neue",Arial,sans-serif', label: 'Helvetica' },
    { value: '"Brush Script MT",cursive', label: '系统手写体' },
  ] },
  { group: '中文 · Chinese', items: [
    { value: '"Noto Sans SC","PingFang SC",sans-serif', label: 'Noto Sans SC · 思源黑体' },
    { value: '"Noto Serif SC","Songti SC",serif', label: 'Noto Serif SC · 简体宋体' },
    { value: '"Noto Serif TC","Songti TC",serif', label: 'Noto Serif TC · 繁体宋体' },
    { value: '"Ma Shan Zheng","Kaiti SC",cursive', label: 'Ma Shan Zheng · 毛笔字' },
    { value: '"ZCOOL XiaoWei","Songti SC",serif', label: 'ZCOOL XiaoWei · 小薇体' },
  ] },
  { group: 'English · Latin', items: [
    { value: '"Great Vibes","Brush Script MT",cursive', label: 'Great Vibes · 邀请函花体' },
    { value: '"Playfair Display",Georgia,serif', label: 'Playfair Display · 优雅衬线' },
    { value: '"Cormorant Garamond",Garamond,serif', label: 'Cormorant Garamond · 古典衬线' },
  ] },
  { group: '日本語 · Japanese', items: [
    { value: '"Noto Serif JP","Yu Mincho",serif', label: 'Noto Serif JP · 日本明朝' },
    { value: '"Shippori Mincho","Yu Mincho",serif', label: 'Shippori Mincho · しっぽり明朝' },
  ] },
  { group: '한국어 · Korean', items: [
    { value: '"Noto Serif KR","AppleMyungjo",serif', label: 'Noto Serif KR · 한국 명조' },
    { value: '"Gowun Batang","AppleMyungjo",serif', label: 'Gowun Batang · 고운바탕' },
  ] },
];

const TOKENS = [
  { value: '{{txt}}', label: 'TXT 数据', icon: IconFileDescription },
  { value: '{{date}}', label: '当前日期', icon: IconCalendar },
  { value: '{{time}}', label: '当前时间', icon: IconClock },
  { value: '{{datetime}}', label: '日期时间', icon: IconCalendar },
  { value: '{{uuid}}', label: '自动 UUID', icon: IconFingerprint },
];

function SectionTitle({ icon: Icon, children }: { icon: typeof IconImageInPicture; children: React.ReactNode }) {
  return <div className="section-title"><Icon size={15} stroke={1.8} /><span>{children}</span></div>;
}

function Helper({ children }: { children: React.ReactNode }) {
  return <Text className="helper" size="xs">{children}</Text>;
}

function AnchorPicker({ layer, update }: { layer: TextLayer; update: (patch: Partial<TextLayer>) => void }) {
  const xs: AnchorX[] = ['left', 'center', 'right'];
  const ys: AnchorY[] = ['top', 'center', 'bottom'];
  return (
    <div className="anchor-picker" role="radiogroup" aria-label="文本框锚点">
      {ys.flatMap((y) => xs.map((x) => {
        const active = layer.anchorX === x && layer.anchorY === y;
        return (
          <button
            type="button"
            key={`${x}-${y}`}
            className={active ? 'anchor-button active' : 'anchor-button'}
            role="radio"
            aria-checked={active}
            aria-label={`${x}-${y} 锚点`}
            onClick={() => update({ anchorX: x, anchorY: y })}
          >
            <span className={`anchor-symbol x-${x} y-${y}`} />
          </button>
        );
      }))}
    </div>
  );
}

function LayerEditor({ layer }: { layer: TextLayer }) {
  const updateLayer = useEditorStore((state) => state.updateLayer);
  const headers = useEditorStore((state) => state.headers);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [csvField, setCsvField] = useState('');
  const [indexWidth, setIndexWidth] = useState<number | string>(3);
  const update = (patch: Partial<TextLayer>) => updateLayer(layer.id, patch);

  const insertToken = (token: string) => {
    const input = textareaRef.current;
    const start = input?.selectionStart ?? layer.text.length;
    const end = input?.selectionEnd ?? start;
    const next = `${layer.text.slice(0, start)}${token}${layer.text.slice(end)}`;
    update({ text: next });
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <section className="panel-section">
      <SectionTitle icon={IconTypography}>3. 编辑选中文本</SectionTitle>
      <Textarea
        ref={textareaRef}
        value={layer.text}
        onChange={(event) => update({ text: event.currentTarget.value })}
        autosize
        minRows={2}
        maxRows={8}
        aria-label="模板文字"
        placeholder="输入模板文字，支持多行和变量"
      />
      <Helper>点击插入变量，可与普通文字自由拼接：</Helper>
      <div className="token-grid">
        {TOKENS.map(({ value, label, icon: Icon }) => (
          <Button key={value} variant="subtle" size="compact-sm" leftSection={<Icon size={14} />} onClick={() => insertToken(value)}>
            {label}
          </Button>
        ))}
      </div>
      <Group gap="xs" wrap="nowrap">
        <TextInput
          value={csvField}
          onChange={(event) => setCsvField(event.currentTarget.value)}
          list={`csv-headers-${layer.id}`}
          placeholder="CSV 表头，如 name"
          aria-label="CSV 表头"
          className="grow-control"
        />
        <datalist id={`csv-headers-${layer.id}`}>{headers.map((header) => <option key={header} value={header} />)}</datalist>
        <Tooltip label="插入 CSV 字段">
          <ActionIcon size="lg" variant="light" aria-label="插入 CSV 字段" onClick={() => csvField.trim() && insertToken(`{{csv.${csvField.trim()}}}`)}>
            <IconTableColumn size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <NumberInput
          value={indexWidth}
          onChange={setIndexWidth}
          min={1}
          max={12}
          label="序号补零位数"
          className="grow-control"
        />
        <Tooltip label="插入补零序号">
          <ActionIcon mt={25} size="lg" variant="light" aria-label="插入补零序号" onClick={() => insertToken(`{{index:${Math.max(1, Math.min(12, Number(indexWidth) || 1))}}}`)}>
            <IconHash size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Helper>示例：尊敬的 {'{{csv.name}}'}，日期 {'{{date}}'}，编号 {'{{index:3}}'}</Helper>

      <Select label="字体" value={layer.font} onChange={(font) => font && update({ font })} data={FONT_OPTIONS} searchable />
      <Helper>网络字体无法加载时，会自动使用同语言的系统字体。</Helper>

      <div className="form-row slider-row">
        <Text component="label" size="sm" fw={600}>字号</Text>
        <Slider min={10} max={200} value={layer.size} onChange={(size) => update({ size })} aria-label="字号" />
        <span className="numeric-value">{Math.round(layer.size)}</span>
      </div>

      <Select
        label="字重"
        value={layer.weight}
        onChange={(weight) => weight && update({ weight })}
        data={[{ value: '300', label: '细' }, { value: '400', label: '常规' }, { value: '600', label: '中粗' }, { value: '700', label: '粗' }]}
      />

      <div className="paired-controls">
        <ColorInput label="颜色" value={layer.color} onChange={(color) => update({ color })} format="hex" />
        <div>
          <Text component="label" size="sm" fw={600}>对齐</Text>
          <SegmentedControl
            fullWidth
            value={layer.align}
            onChange={(align) => update({ align: align as HorizontalAlign })}
            aria-label="文字对齐"
            data={[
              { value: 'left', label: <IconAlignLeft size={17} aria-label="左对齐" /> },
              { value: 'center', label: <IconAlignCenter size={17} aria-label="居中对齐" /> },
              { value: 'right', label: <IconAlignRight size={17} aria-label="右对齐" /> },
            ]}
          />
        </div>
      </div>

      <div className="labeled-control">
        <Text component="label" size="sm" fw={600}>锚点</Text>
        <AnchorPicker layer={layer} update={update} />
      </div>
      <Helper>锚点固定文本框坐标；换行后内容沿锚点方向扩展。</Helper>

      <div className="width-row">
        <Select
          label="宽度"
          value={layer.width === null ? 'auto' : 'fixed'}
          onChange={(mode) => update({ width: mode === 'fixed' ? layer.width ?? 320 : null })}
          data={[{ value: 'auto', label: '随内容' }, { value: 'fixed', label: '固定宽度' }]}
          allowDeselect={false}
        />
        <NumberInput
          label="像素"
          suffix=" px"
          min={40}
          max={20_000}
          disabled={layer.width === null}
          value={layer.width ?? 320}
          onChange={(value) => update({ width: Math.max(40, Number(value) || 320) })}
        />
      </div>
      <Helper>固定宽度时自动换行，也可拖动画布文本框两侧的手柄调整。</Helper>

      <div className="form-row slider-row">
        <Text component="label" size="sm" fw={600}>字距</Text>
        <Slider min={-5} max={30} value={layer.spacing} onChange={(spacing) => update({ spacing })} aria-label="字距" />
        <span className="numeric-value">{layer.spacing}</span>
      </div>

      <div className="stroke-row">
        <ColorInput label="描边" value={layer.stroke} onChange={(stroke) => update({ stroke })} format="hex" />
        <div>
          <Text component="label" size="sm" fw={600}>粗细</Text>
          <Slider min={0} max={10} value={layer.strokeW} onChange={(strokeW) => update({ strokeW })} aria-label="描边粗细" />
        </div>
        <span className="numeric-value">{layer.strokeW}</span>
      </div>
    </section>
  );
}

export function ControlPanel() {
  const canvas = useEditorStore((state) => state.canvas);
  const background = useEditorStore((state) => state.background);
  const layers = useEditorStore((state) => state.layers);
  const selectedId = useEditorStore((state) => state.selectedId);
  const records = useEditorStore((state) => state.records);
  const headers = useEditorStore((state) => state.headers);
  const importedSignature = useEditorStore((state) => state.importedSignature);
  const previewIndex = useEditorStore((state) => state.previewIndex);
  const batchProgress = useEditorStore((state) => state.batchProgress);
  const addLayer = useEditorStore((state) => state.addLayer);
  const removeLayer = useEditorStore((state) => state.removeLayer);
  const selectLayer = useEditorStore((state) => state.selectLayer);
  const setBackground = useEditorStore((state) => state.setBackground);
  const setPadding = useEditorStore((state) => state.setPadding);
  const setImportedData = useEditorStore((state) => state.setImportedData);
  const setPreviewIndex = useEditorStore((state) => state.setPreviewIndex);
  const setBatchProgress = useEditorStore((state) => state.setBatchProgress);
  const replaceTemplate = useEditorStore((state) => state.replaceTemplate);
  const selected = layers.find((layer) => layer.id === selectedId) ?? null;
  const binding = useMemo(() => analyzeBindings(layers), [layers]);
  const importedIsCurrent = records.length > 0 && importedSignature === binding.signature;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<ReturnType<typeof parseTemplateFile> | null>(null);

  const notifyError = (error: unknown) => notifications.show({
    color: 'red', title: '操作未完成', message: error instanceof Error ? error.message : '发生未知错误',
  });

  const uploadBackground = async (file: File | null) => {
    if (!file) return;
    try {
      const next = await backgroundFromFile(file);
      releaseBackground(background);
      setBackground(next);
      notifications.show({ color: 'green', title: '底图已载入', message: `${next.naturalWidth} × ${next.naturalHeight}px` });
    } catch (error) { notifyError(error); }
  };

  const uploadData = async (file: File | null) => {
    if (!file) return;
    try {
      const result = await importDataFile(file, binding);
      setImportedData(result.records, result.headers, binding.signature);
      notifications.show({ color: 'green', title: '数据已导入', message: `共 ${result.records.length} 条记录` });
    } catch (error) { notifyError(error); }
  };

  const currentContext = () => ({
    record: importedIsCurrent ? records[previewIndex] : null,
    index: importedIsCurrent ? previewIndex + 1 : 1,
    now: new Date(),
    uuidByLayer: new Map<string, string>(),
  });

  const exportCurrent = async () => {
    if (background.isPlaceholder) { notifyError(new Error('请先上传正式底图')); return; }
    try {
      const blob = await renderInvitationBlob(background.url, canvas, layers, currentContext());
      downloadBlob(blob, 'invitation.png');
      notifications.show({ color: 'green', title: '图片已生成', message: 'PNG 已保存到下载目录' });
    } catch (error) { notifyError(error); }
  };

  const exportBatch = async () => {
    if (background.isPlaceholder) { notifyError(new Error('请先上传正式底图')); return; }
    if (!importedIsCurrent) { notifyError(new Error('请导入与当前变量匹配的数据')); return; }
    setBatchProgress(0);
    try {
      const zip = await renderBatchZip(background.url, canvas, layers, records, setBatchProgress);
      downloadBlob(zip, `invitations-${Date.now()}.zip`);
      notifications.show({ color: 'green', title: '批量生成完成', message: `${records.length} 张图片已打包下载` });
    } catch (error) { notifyError(error); }
    finally { setBatchProgress(null); }
  };

  const importTemplate = async (file: File | null) => {
    if (!file) return;
    try {
      const parsed = parseTemplateFile(await file.text());
      if (layers.length) setPendingTemplate(parsed);
      else replaceTemplate(parsed.canvas, parsed.layers);
    } catch (error) { notifyError(error); }
  };

  const exportTemplate = () => {
    const blob = new Blob([JSON.stringify(buildTemplate(canvas, layers), null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'invitation-template.json');
    notifications.show({ color: 'green', title: '模板已导出', message: '模板不包含底图和导入数据' });
  };

  const importStatus = binding.mode === 'conflict' ? 'TXT 与 CSV 变量不能混用'
    : binding.mode === 'none' ? '插入 {{txt}} 或 {{csv.表头}} 后可导入数据'
      : importedIsCurrent ? `已导入 ${records.length} 条${binding.mode.toUpperCase()} 数据`
        : `等待导入 ${binding.mode.toUpperCase()} 文件`;

  return (
    <aside className="control-panel">
      <header className="app-title">
        <IconImageInPicture size={24} stroke={1.6} />
        <div><strong>邀请函生成器</strong><small>Invitation Atelier</small></div>
      </header>

      <section className="panel-section">
        <SectionTitle icon={IconImageInPicture}>1. 底图</SectionTitle>
        <Button component="label" variant="light" leftSection={<IconPhotoUp size={17} />} fullWidth>
          点击或拖拽上传图片
          <input id="background-file" hidden type="file" accept="image/*" onChange={(event) => void uploadBackground(event.currentTarget.files?.[0] ?? null)} />
        </Button>
        <NumberInput label="安全内边距" suffix=" px" min={0} max={Math.floor(Math.min(canvas.width, canvas.height) / 2)} value={canvas.padding} onChange={(value) => setPadding(Number(value) || 0)} />
        <Helper>拖动文字时会吸附画布边缘、中心、安全区及其他文本；按住 Alt 可临时关闭吸附。</Helper>
      </section>

      <section className="panel-section">
        <SectionTitle icon={IconStack}>2. 文本图层</SectionTitle>
        <Button leftSection={<IconPlus size={17} />} onClick={addLayer}>添加文本</Button>
        <Stack gap={6}>
          {layers.map((layer, index) => (
            <button type="button" className={selectedId === layer.id ? 'layer-item active' : 'layer-item'} key={layer.id} onClick={() => selectLayer(layer.id)}>
              <span>#{index + 1}</span><span className="layer-preview">{layer.text || '空文本'}</span>
              <ActionIcon component="span" variant="subtle" color="red" aria-label={`删除 #${index + 1}`} onClick={(event) => { event.stopPropagation(); setDeleteId(layer.id); }}>
                <IconTrash size={16} />
              </ActionIcon>
            </button>
          ))}
        </Stack>
      </section>

      {selected ? <LayerEditor key={selected.id} layer={selected} /> : null}

      <section className="panel-section">
        <SectionTitle icon={IconDatabase}>4. 批量数据</SectionTitle>
        <Button component="label" variant="light" leftSection={<IconFileImport size={17} />} disabled={binding.mode === 'none' || binding.mode === 'conflict'}>
          导入 {binding.mode === 'txt' ? 'TXT' : binding.mode === 'csv' ? 'CSV' : 'CSV / TXT'}
          <input hidden type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => void uploadData(event.currentTarget.files?.[0] ?? null)} />
        </Button>
        <Helper>系统按模板中的 {'{{txt}}'} 或 {'{{csv.表头}}'} 自动判断数据源。</Helper>
        <Text size="xs" c={binding.mode === 'conflict' ? 'red' : 'dimmed'}>{importStatus}</Text>
        {importedIsCurrent ? (
          <ScrollArea h={180} className="data-table-wrap">
            <Table striped highlightOnHover stickyHeader>
              <Table.Thead><Table.Tr><Table.Th>#</Table.Th>{headers.map((header) => <Table.Th key={header}>{header}</Table.Th>)}</Table.Tr></Table.Thead>
              <Table.Tbody>{records.map((record, index) => (
                <Table.Tr key={index} className={previewIndex === index ? 'preview-row' : undefined} tabIndex={0} onClick={() => setPreviewIndex(index)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setPreviewIndex(index); }}>
                  <Table.Td>{index + 1}</Table.Td>{headers.map((header) => <Table.Td key={header}>{record[header]}</Table.Td>)}
                </Table.Tr>
              ))}</Table.Tbody>
            </Table>
          </ScrollArea>
        ) : null}
        {batchProgress !== null ? <Progress value={batchProgress * 100} animated /> : null}
        <Button leftSection={<IconFileZip size={17} />} disabled={!importedIsCurrent || batchProgress !== null} onClick={() => void exportBatch()}>
          {batchProgress !== null ? `生成中 ${Math.round(batchProgress * 100)}%` : '批量生成并下载 ZIP'}
        </Button>
      </section>

      <section className="panel-section">
        <SectionTitle icon={IconDownload}>5. 单张下载</SectionTitle>
        <Button leftSection={<IconImageInPicture size={17} />} onClick={() => void exportCurrent()}>下载当前图片</Button>
        <Helper>始终按底图原始分辨率生成 PNG，所有文件只在当前浏览器处理。</Helper>
      </section>

      <Accordion variant="separated" className="advanced-section">
        <Accordion.Item value="template">
          <Accordion.Control icon={<IconCode size={16} />}>高级功能</Accordion.Control>
          <Accordion.Panel>
            <Group grow>
              <Button component="label" variant="default" leftSection={<IconFileImport size={16} />}>
                导入模板<input hidden type="file" accept=".json,application/json" onChange={(event) => void importTemplate(event.currentTarget.files?.[0] ?? null)} />
              </Button>
              <Button variant="default" leftSection={<IconCode size={16} />} onClick={exportTemplate}>导出模板</Button>
            </Group>
            <Helper>模板只替换文本图层，当前底图保持不变。</Helper>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Modal opened={deleteId !== null} onClose={() => setDeleteId(null)} title="删除文本图层？" centered>
        <Text size="sm" c="dimmed">此操作会移除该图层；如果它包含数据变量，当前导入数据也会失效。</Text>
        <Group justify="flex-end" mt="lg"><Button variant="default" onClick={() => setDeleteId(null)}>取消</Button><Button color="red" onClick={() => { if (deleteId) removeLayer(deleteId); setDeleteId(null); }}>删除</Button></Group>
      </Modal>

      <Modal opened={pendingTemplate !== null} onClose={() => setPendingTemplate(null)} title="替换当前文本图层？" centered>
        <Text size="sm" c="dimmed">导入模板会替换当前全部文本图层和安全内边距，底图保持不变。</Text>
        <Group justify="flex-end" mt="lg"><Button variant="default" onClick={() => setPendingTemplate(null)}>取消</Button><Button onClick={() => { if (pendingTemplate) replaceTemplate(pendingTemplate.canvas, pendingTemplate.layers); setPendingTemplate(null); }}>导入模板</Button></Group>
      </Modal>
    </aside>
  );
}
