import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Button,
  ColorInput,
  Group,
  Menu,
  Modal,
  NumberInput,
  Progress,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBrandGithub,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconClock,
  IconCode,
  IconDatabase,
  IconDeviceDesktop,
  IconDownload,
  IconFileDescription,
  IconFileDownload,
  IconFileImport,
  IconFileTypeCsv,
  IconFileTypeTxt,
  IconFileZip,
  IconFingerprint,
  IconImageInPicture,
  IconLanguage,
  IconStack,
  IconPhotoUp,
  IconPlus,
  IconMoon,
  IconSun,
  IconTransferOut,
  IconTrash,
  IconTypography,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { AnchorX, AnchorY, HorizontalAlign, TextLayer } from '../model';
import { analyzeBindings } from '../lib/template';
import { importDataFile } from '../lib/data';
import { buildTemplate, parseTemplateFile } from '../lib/template-json';
import { downloadBlob, renderBatchZip, renderInvitationBlob } from '../lib/render';
import { backgroundFromFile, releaseBackground } from '../lib/image-file';
import { clearEditorPersistence } from '../lib/editor-persistence';
import { formatCopyright } from '../lib/copyright';
import { AppError, translateError } from '../lib/app-error';
import { resolveLanguage, translate } from '../i18n';
import type { AppLanguage, TranslationKey } from '../i18n/resources';
import { useEditorStore } from '../store/editor';
import packageJson from '../../package.json';

const GITHUB_URL = 'https://github.com/dofy/invite-maker';

function fontOptions(t: TFunction) {
  return [
  { group: t('editor.fontGroupSystem'), items: [
    { value: '"PingFang SC","Microsoft YaHei",sans-serif', label: t('editor.fontSystemSans') },
    { value: '"Songti SC","SimSun",serif', label: t('editor.fontSystemSerif') },
    { value: '"Kaiti SC","KaiTi",serif', label: t('editor.fontSystemKai') },
    { value: 'Georgia,serif', label: 'Georgia' },
    { value: '"Helvetica Neue",Arial,sans-serif', label: 'Helvetica' },
    { value: '"Brush Script MT",cursive', label: t('editor.fontSystemScript') },
  ] },
  { group: t('editor.fontGroupChinese'), items: [
    { value: '"Noto Sans SC","PingFang SC",sans-serif', label: 'Noto Sans SC' },
    { value: '"Noto Serif SC","Songti SC",serif', label: 'Noto Serif SC' },
    { value: '"Noto Serif TC","Songti TC",serif', label: 'Noto Serif TC' },
    { value: '"Ma Shan Zheng","Kaiti SC",cursive', label: 'Ma Shan Zheng' },
    { value: '"ZCOOL XiaoWei","Songti SC",serif', label: 'ZCOOL XiaoWei' },
  ] },
  { group: t('editor.fontGroupLatin'), items: [
    { value: '"Great Vibes","Brush Script MT",cursive', label: `Great Vibes · ${t('editor.fontGreatVibes')}` },
    { value: '"Playfair Display",Georgia,serif', label: `Playfair Display · ${t('editor.fontPlayfair')}` },
    { value: '"Cormorant Garamond",Garamond,serif', label: `Cormorant Garamond · ${t('editor.fontCormorant')}` },
  ] },
  { group: t('editor.fontGroupJapanese'), items: [
    { value: '"Noto Serif JP","Yu Mincho",serif', label: 'Noto Serif JP' },
    { value: '"Shippori Mincho","Yu Mincho",serif', label: 'Shippori Mincho' },
  ] },
  { group: t('editor.fontGroupKorean'), items: [
    { value: '"Noto Serif KR","AppleMyungjo",serif', label: 'Noto Serif KR' },
    { value: '"Gowun Batang","AppleMyungjo",serif', label: 'Gowun Batang' },
  ] },
  ];
}

function tokenOptions(t: TFunction) {
  return [
    { value: '{{txt}}', label: t('editor.tokenTxt'), icon: IconFileDescription },
    { value: '{{date}}', label: t('editor.tokenDate'), icon: IconCalendar },
    { value: '{{time}}', label: t('editor.tokenTime'), icon: IconClock },
    { value: '{{datetime}}', label: t('editor.tokenDateTime'), icon: IconCalendar },
    { value: '{{uuid}}', label: t('editor.tokenUuid'), icon: IconFingerprint },
  ];
}

const LANGUAGE_OPTIONS: Array<{ value: AppLanguage; key: TranslationKey }> = [
  { value: 'zh-CN', key: 'language.zhCN' },
  { value: 'zh-TW', key: 'language.zhTW' },
  { value: 'en', key: 'language.en' },
  { value: 'de', key: 'language.de' },
  { value: 'ja', key: 'language.ja' },
  { value: 'ko', key: 'language.ko' },
  { value: 'es', key: 'language.es' },
  { value: 'fr', key: 'language.fr' },
];

function SectionTitle({ icon: Icon, children }: { icon: typeof IconImageInPicture; children: React.ReactNode }) {
  return <h2 className="section-title"><Icon size={15} stroke={1.8} /><span>{children}</span></h2>;
}

function Helper({ children }: { children: React.ReactNode }) {
  return <Text className="helper" size="xs">{children}</Text>;
}

function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const currentLanguage = resolveLanguage(i18n.resolvedLanguage) ?? 'en';

  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.title = t('meta.title');
    document.querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute('content', t('meta.description'));
  }, [currentLanguage, t]);

  return (
    <Menu position="bottom-end" width={190} withinPortal>
      <Menu.Target>
        <ActionIcon
          className="language-picker"
          variant="default"
          radius="xl"
          aria-label={t('language.label')}
          title={t('language.label')}
        >
          <IconLanguage size={16} stroke={1.8} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t('language.label')}</Menu.Label>
        {LANGUAGE_OPTIONS.map((option) => (
          <Menu.Item
            key={option.value}
            rightSection={option.value === currentLanguage ? <IconCheck size={14} /> : null}
            onClick={() => void i18n.changeLanguage(option.value)}
          >
            {t(option.key)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

function ThemePicker() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: false });

  useEffect(() => {
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', computedColorScheme === 'light' ? '#e4e8ec' : '#0c0e12');
  }, [computedColorScheme]);

  const option = (label: string, Icon: typeof IconSun) => (
    <span className="theme-option" title={label}>
      <Icon size={14} stroke={1.8} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  );

  return (
    <SegmentedControl<MantineColorScheme>
      className="theme-picker"
      size="xs"
      radius="xl"
      aria-label={t('theme.label')}
      value={colorScheme}
      onChange={setColorScheme}
      data={[
        { value: 'auto', label: option(t('theme.system'), IconDeviceDesktop) },
        { value: 'light', label: option(t('theme.light'), IconSun) },
        { value: 'dark', label: option(t('theme.dark'), IconMoon) },
      ]}
    />
  );
}

export function AppHeader() {
  const { t } = useTranslation();

  return (
    <header className="app-title">
      <IconImageInPicture size={24} stroke={1.6} />
      <div className="app-brand">
        <div className="app-brand-heading">
          <h1>{t('app.name')}</h1>
          <span className="app-version">v{packageJson.version}</span>
        </div>
        <small>{t('app.subtitle')}</small>
      </div>
      <div className="app-title-controls"><LanguagePicker /><ThemePicker /></div>
    </header>
  );
}

function AnchorPicker({ layer, update }: { layer: TextLayer; update: (patch: Partial<TextLayer>) => void }) {
  const { t } = useTranslation();
  const xs: AnchorX[] = ['left', 'center', 'right'];
  const ys: AnchorY[] = ['top', 'center', 'bottom'];
  const horizontalLabel = (value: AnchorX) => t(value === 'left' ? 'editor.anchorLeft' : value === 'right' ? 'editor.anchorRight' : 'editor.anchorCenter');
  const verticalLabel = (value: AnchorY) => t(value === 'top' ? 'editor.anchorTop' : value === 'bottom' ? 'editor.anchorBottom' : 'editor.anchorCenter');
  return (
    <div className="anchor-picker" role="radiogroup" aria-label={t('editor.anchor')}>
      {ys.flatMap((y) => xs.map((x) => {
        const active = layer.anchorX === x && layer.anchorY === y;
        return (
          <button
            type="button"
            key={`${x}-${y}`}
            className={active ? 'anchor-button active' : 'anchor-button'}
            role="radio"
            aria-checked={active}
            aria-label={translate(t, 'editor.anchorAria', { horizontal: horizontalLabel(x), vertical: verticalLabel(y) })}
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
  const { t } = useTranslation();
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
      <SectionTitle icon={IconTypography}>{t('section.editor')}</SectionTitle>
      <Textarea
        ref={textareaRef}
        value={layer.text}
        onChange={(event) => update({ text: event.currentTarget.value })}
        autosize
        minRows={2}
        maxRows={8}
        aria-label={t('editor.textAria')}
        placeholder={t('editor.textPlaceholder')}
      />
      <Helper>{t('editor.tokenHelp')}</Helper>
      <div className="token-grid">
        {tokenOptions(t).map(({ value, label, icon: Icon }) => (
          <Button key={value} variant="subtle" size="compact-sm" leftSection={<Icon size={14} />} onClick={() => insertToken(value)}>
            {label}
          </Button>
        ))}
      </div>
      <TextInput
        label={t('editor.csvAria')}
        value={csvField}
        onChange={(event) => setCsvField(event.currentTarget.value)}
        list={`csv-headers-${layer.id}`}
        placeholder={t('editor.csvPlaceholder')}
        rightSectionPointerEvents="all"
        rightSectionWidth={40}
        rightSection={(
          <Tooltip label={t('editor.csvInsert')}>
            <ActionIcon className="input-insert-action" size="sm" variant="subtle" disabled={!csvField.trim()} aria-label={t('editor.csvInsert')} onClick={() => csvField.trim() && insertToken(`{{csv.${csvField.trim()}}}`)}>
              <IconTransferOut size={17} />
            </ActionIcon>
          </Tooltip>
        )}
      />
      <datalist id={`csv-headers-${layer.id}`}>{headers.map((header) => <option key={header} value={header} />)}</datalist>
      <NumberInput
        value={indexWidth}
        onChange={setIndexWidth}
        min={1}
        max={12}
        label={t('editor.indexDigits')}
        hideControls
        rightSectionPointerEvents="all"
        rightSectionWidth={40}
        rightSection={(
          <Tooltip label={t('editor.indexInsert')}>
            <ActionIcon className="input-insert-action" size="sm" variant="subtle" aria-label={t('editor.indexInsert')} onClick={() => insertToken(`{{index:${Math.max(1, Math.min(12, Number(indexWidth) || 1))}}}`)}>
              <IconTransferOut size={17} />
            </ActionIcon>
          </Tooltip>
        )}
      />
      <Helper>{t('editor.example')}</Helper>

      <Select label={t('editor.font')} value={layer.font} onChange={(font) => font && update({ font })} data={fontOptions(t)} searchable />
      <Helper>{t('editor.fontFallback')}</Helper>

      <NumberInput
        label={t('editor.fontSize')}
        suffix=" px"
        min={8}
        max={2_000}
        step={1}
        hideControls
        clampBehavior="strict"
        value={Math.round(layer.size)}
        onChange={(value) => {
          const size = Number(value);
          if (Number.isFinite(size) && size >= 8 && size <= 2_000) update({ size });
        }}
      />

      <Select
        label={t('editor.fontWeight')}
        value={layer.weight}
        onChange={(weight) => weight && update({ weight })}
        data={[{ value: '300', label: t('editor.weightLight') }, { value: '400', label: t('editor.weightRegular') }, { value: '600', label: t('editor.weightSemibold') }, { value: '700', label: t('editor.weightBold') }]}
      />

      <div className="paired-controls">
        <ColorInput label={t('editor.color')} value={layer.color} onChange={(color) => update({ color })} format="hex" />
        <div>
          <Text component="label" size="sm" fw={600}>{t('editor.alignment')}</Text>
          <SegmentedControl
            fullWidth
            value={layer.align}
            onChange={(align) => update({ align: align as HorizontalAlign })}
            aria-label={t('editor.alignmentAria')}
            data={[
              { value: 'left', label: <IconAlignLeft size={17} aria-label={t('editor.alignLeft')} /> },
              { value: 'center', label: <IconAlignCenter size={17} aria-label={t('editor.alignCenter')} /> },
              { value: 'right', label: <IconAlignRight size={17} aria-label={t('editor.alignRight')} /> },
            ]}
          />
        </div>
      </div>

      <div className="labeled-control">
        <Text component="label" size="sm" fw={600}>{t('editor.anchor')}</Text>
        <AnchorPicker layer={layer} update={update} />
      </div>
      <Helper>{t('editor.anchorHelp')}</Helper>

      <div className="width-row">
        <Select
          className="width-mode-select"
          classNames={{ option: 'width-mode-option' }}
          label={t('editor.width')}
          value={layer.width === null ? 'auto' : 'fixed'}
          onChange={(mode) => update({ width: mode === 'fixed' ? layer.width ?? 320 : null })}
          data={[{ value: 'auto', label: t('editor.widthAuto') }, { value: 'fixed', label: t('editor.widthFixed') }]}
          allowDeselect={false}
        />
        <NumberInput
          label={t('editor.pixels')}
          suffix=" px"
          min={40}
          max={20_000}
          disabled={layer.width === null}
          value={layer.width ?? 320}
          onChange={(value) => update({ width: Math.max(40, Number(value) || 320) })}
        />
      </div>
      <Helper>{t('editor.resizeHelp')}</Helper>

      <div className="style-fields">
        <Text component="label" htmlFor={`letter-spacing-${layer.id}`} size="sm" fw={600}>{t('editor.letterSpacing')}</Text>
        <NumberInput
          id={`letter-spacing-${layer.id}`}
          aria-label={t('editor.letterSpacing')}
          suffix=" px"
          min={-5}
          max={30}
          value={layer.spacing}
          onChange={(value) => update({ spacing: Math.max(-5, Math.min(30, Number(value) || 0)) })}
        />
        <Text component="label" htmlFor={`stroke-color-${layer.id}`} size="sm" fw={600}>{t('editor.stroke')}</Text>
        <ColorInput id={`stroke-color-${layer.id}`} aria-label={t('editor.stroke')} value={layer.stroke} onChange={(stroke) => update({ stroke })} format="hex" />
        <Text component="label" htmlFor={`stroke-width-${layer.id}`} size="sm" fw={600}>{t('editor.strokeWidth')}</Text>
        <NumberInput
          id={`stroke-width-${layer.id}`}
          aria-label={t('editor.strokeWidth')}
          suffix=" px"
          min={0}
          max={10}
          value={layer.strokeW}
          onChange={(value) => update({ strokeW: Math.max(0, Math.min(10, Number(value) || 0)) })}
        />
      </div>
    </section>
  );
}

export function ControlPanel() {
  const { t } = useTranslation();
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
  const resetWorkspace = useEditorStore((state) => state.resetWorkspace);
  const selected = layers.find((layer) => layer.id === selectedId) ?? null;
  const binding = useMemo(() => analyzeBindings(layers), [layers]);
  const importedIsCurrent = records.length > 0 && importedSignature === binding.signature;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingTemplate, setPendingTemplate] = useState<ReturnType<typeof parseTemplateFile> | null>(null);
  const [resetOpened, setResetOpened] = useState(false);
  const [resetting, setResetting] = useState(false);

  const notifyError = (error: unknown) => notifications.show({
    color: 'red', title: t('toast.errorTitle'), message: translateError(error, t),
  });

  const uploadBackground = async (file: File | null) => {
    if (!file) return;
    try {
      const next = await backgroundFromFile(file);
      releaseBackground(background);
      setBackground(next);
      notifications.show({ color: 'green', title: t('toast.backgroundLoaded'), message: `${next.naturalWidth} × ${next.naturalHeight}px` });
    } catch (error) { notifyError(error); }
  };

  const uploadData = async (file: File | null) => {
    if (!file) return;
    try {
      const result = await importDataFile(file, binding);
      setImportedData(result.records, result.headers, binding.signature);
      notifications.show({ color: 'green', title: t('toast.dataImported'), message: translate(t, 'toast.dataImportedMessage', { count: result.records.length }) });
    } catch (error) { notifyError(error); }
  };

  const currentContext = () => ({
    record: importedIsCurrent ? records[previewIndex] : null,
    index: importedIsCurrent ? previewIndex + 1 : 1,
    now: new Date(),
    uuidByLayer: new Map<string, string>(),
  });

  const exportCurrent = async () => {
    if (background.isPlaceholder) { notifyError(new AppError('errors.uploadBackgroundFirst')); return; }
    try {
      const blob = await renderInvitationBlob(background.url, canvas, layers, currentContext());
      downloadBlob(blob, 'invitation.png');
      notifications.show({ color: 'green', title: t('toast.imageGenerated'), message: t('toast.imageSaved') });
    } catch (error) { notifyError(error); }
  };

  const exportBatch = async () => {
    if (background.isPlaceholder) { notifyError(new AppError('errors.uploadBackgroundFirst')); return; }
    if (!importedIsCurrent) { notifyError(new AppError('errors.dataMismatch')); return; }
    setBatchProgress(0);
    try {
      const zip = await renderBatchZip(background.url, canvas, layers, records, setBatchProgress);
      downloadBlob(zip, `invitations-${Date.now()}.zip`);
      notifications.show({ color: 'green', title: t('toast.batchComplete'), message: translate(t, 'toast.batchSaved', { count: records.length }) });
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
    notifications.show({ color: 'green', title: t('toast.templateExported'), message: t('toast.templateExportedMessage') });
  };

  const resetWorkspaceData = async () => {
    setResetting(true);
    try {
      await clearEditorPersistence();
      releaseBackground(useEditorStore.getState().background);
      resetWorkspace();
      setResetOpened(false);
      notifications.show({ color: 'green', title: t('toast.workspaceReset'), message: t('toast.workspaceResetMessage') });
    } catch (error) { notifyError(error); }
    finally { setResetting(false); }
  };

  const importStatus = binding.mode === 'conflict' ? t('data.conflict')
    : binding.mode === 'none' ? t('data.none')
      : importedIsCurrent ? translate(t, 'data.imported', { count: records.length, type: binding.mode.toUpperCase() })
        : translate(t, 'data.waiting', { type: binding.mode.toUpperCase() });

  return (
    <aside className="control-panel">
      <div className="control-panel-scroll">
      <section className="panel-section">
        <SectionTitle icon={IconImageInPicture}>{t('section.background')}</SectionTitle>
        <Button component="label" variant="light" leftSection={<IconPhotoUp size={17} />} fullWidth>
          {t('background.upload')}
          <input id="background-file" hidden type="file" accept="image/*" onChange={(event) => void uploadBackground(event.currentTarget.files?.[0] ?? null)} />
        </Button>
        <NumberInput label={t('background.padding')} suffix=" px" min={0} max={Math.floor(Math.min(canvas.width, canvas.height) / 2)} value={canvas.padding} onChange={(value) => setPadding(Number(value) || 0)} />
        <Helper>{t('background.helper')}</Helper>
      </section>

      <section className="panel-section">
        <SectionTitle icon={IconStack}>{t('section.layers')}</SectionTitle>
        <Button leftSection={<IconPlus size={17} />} onClick={() => addLayer(t('layers.defaultText'))}>{t('layers.add')}</Button>
        <Stack gap={6}>
          {layers.map((layer, index) => (
            <button type="button" className={selectedId === layer.id ? 'layer-item active' : 'layer-item'} key={layer.id} onClick={() => selectLayer(layer.id)}>
              <span>#{index + 1}</span><span className="layer-preview">{layer.text || t('layers.empty')}</span>
              <ActionIcon component="span" variant="subtle" color="red" aria-label={translate(t, 'layers.deleteAria', { index: index + 1 })} onClick={(event) => { event.stopPropagation(); setDeleteId(layer.id); }}>
                <IconTrash size={16} />
              </ActionIcon>
            </button>
          ))}
        </Stack>
      </section>

      {selected ? <LayerEditor key={selected.id} layer={selected} /> : null}

      <section className="panel-section">
        <SectionTitle icon={IconDatabase}>{t('section.batch')}</SectionTitle>
        <h3 className="panel-subtitle">{t('data.sourceTitle')}</h3>
        <div className="batch-actions">
          <Button component="label" variant="light" leftSection={<IconFileImport size={17} />} disabled={binding.mode === 'none' || binding.mode === 'conflict'}>
            {translate(t, 'data.import', { type: binding.mode === 'txt' ? 'TXT' : binding.mode === 'csv' ? 'CSV' : 'CSV / TXT' })}
            <input hidden type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => void uploadData(event.currentTarget.files?.[0] ?? null)} />
          </Button>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <Button variant="default" leftSection={<IconFileDownload size={17} />} rightSection={<IconChevronDown size={14} />}>
                {t('data.examples')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component="a" href="/examples/csv-single-field.csv" download leftSection={<IconFileTypeCsv size={17} />}>
                {t('data.exampleCsvSingle')}
              </Menu.Item>
              <Menu.Item component="a" href="/examples/csv-multiple-fields.csv" download leftSection={<IconFileTypeCsv size={17} />}>
                {t('data.exampleCsvMultiple')}
              </Menu.Item>
              <Menu.Item component="a" href="/examples/txt-names.txt" download leftSection={<IconFileTypeTxt size={17} />}>
                {t('data.exampleTxtNames')}
              </Menu.Item>
              <Menu.Item component="a" href="/examples/txt-complete-lines.txt" download leftSection={<IconFileTypeTxt size={17} />}>
                {t('data.exampleTxtLines')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
        <Helper>{t('data.hint')}</Helper>
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
          {batchProgress !== null ? translate(t, 'data.generating', { progress: Math.round(batchProgress * 100) }) : t('data.download')}
        </Button>
      </section>

      <section className="panel-section">
        <SectionTitle icon={IconDownload}>{t('section.single')}</SectionTitle>
        <Button leftSection={<IconImageInPicture size={17} />} onClick={() => void exportCurrent()}>{t('single.download')}</Button>
        <Helper>{t('single.help')}</Helper>
      </section>

        <Accordion variant="separated" className="advanced-section">
          <Accordion.Item value="template">
            <Accordion.Control icon={<IconCode size={16} />}>{t('advanced.title')}</Accordion.Control>
            <Accordion.Panel>
              <Group grow>
                <Button component="label" variant="default" leftSection={<IconFileImport size={16} />}>
                  {t('advanced.import')}<input hidden type="file" accept=".json,application/json" onChange={(event) => void importTemplate(event.currentTarget.files?.[0] ?? null)} />
                </Button>
                <Button variant="default" leftSection={<IconCode size={16} />} onClick={exportTemplate}>{t('advanced.export')}</Button>
              </Group>
              <Helper>{t('advanced.help')}</Helper>
              <Button color="red" variant="light" fullWidth mt="md" leftSection={<IconTrash size={16} />} onClick={() => setResetOpened(true)}>
                {t('advanced.reset')}
              </Button>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>

      <footer className="site-footer">
        <span className="site-footer-copyright" title={formatCopyright(window.location.hostname)}>
          {formatCopyright(window.location.hostname)}
        </span>
        <nav className="site-footer-links" aria-label={t('footer.navigation')}>
          <a href="/about">{t('footer.about')}</a>
          <a href="/privacy">{t('footer.privacy')}</a>
          <a href="/terms">{t('footer.terms')}</a>
          <a href="https://github.com/dofy/invite-maker/issues" target="_blank" rel="noreferrer">{t('footer.contact')}</a>
        </nav>
        <a className="site-footer-github" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label={t('footer.github')}>
          <IconBrandGithub size={14} stroke={1.8} />
        </a>
      </footer>

      <Modal opened={deleteId !== null} onClose={() => setDeleteId(null)} title={t('modal.deleteTitle')} centered>
        <Text size="sm" c="dimmed">{t('modal.deleteBody')}</Text>
        <Group justify="flex-end" mt="lg"><Button variant="default" onClick={() => setDeleteId(null)}>{t('modal.cancel')}</Button><Button color="red" onClick={() => { if (deleteId) removeLayer(deleteId); setDeleteId(null); }}>{t('modal.delete')}</Button></Group>
      </Modal>

      <Modal opened={pendingTemplate !== null} onClose={() => setPendingTemplate(null)} title={t('modal.templateTitle')} centered>
        <Text size="sm" c="dimmed">{t('modal.templateBody')}</Text>
        <Group justify="flex-end" mt="lg"><Button variant="default" onClick={() => setPendingTemplate(null)}>{t('modal.cancel')}</Button><Button onClick={() => { if (pendingTemplate) replaceTemplate(pendingTemplate.canvas, pendingTemplate.layers); setPendingTemplate(null); }}>{t('modal.import')}</Button></Group>
      </Modal>

      <Modal opened={resetOpened} onClose={() => { if (!resetting) setResetOpened(false); }} title={t('modal.resetTitle')} centered closeOnClickOutside={!resetting} closeOnEscape={!resetting}>
        <Text size="sm" c="dimmed">{t('modal.resetBody')}</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" disabled={resetting} onClick={() => setResetOpened(false)}>{t('modal.cancel')}</Button>
          <Button color="red" loading={resetting} onClick={() => void resetWorkspaceData()}>{t('modal.reset')}</Button>
        </Group>
      </Modal>
    </aside>
  );
}
