import { memo, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Button,
  Group,
  Menu,
  Modal,
  NumberInput,
  Progress,
  SegmentedControl,
  Stack,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsMaximize,
  IconBrandGithub,
  IconCheck,
  IconChevronDown,
  IconCode,
  IconDatabase,
  IconDeviceDesktop,
  IconDownload,
  IconFileDownload,
  IconFileImport,
  IconFileTypeCsv,
  IconFileTypeTxt,
  IconFileZip,
  IconImageInPicture,
  IconLanguage,
  IconStack,
  IconPhotoUp,
  IconPlus,
  IconMoon,
  IconSun,
  IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
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
import { DataPreviewTable } from './DataPreview';
import { LayerEditor } from './LayerEditor';
import { Helper, SectionTitle } from './PanelPrimitives';
import packageJson from '../../package.json';

const GITHUB_URL = 'https://github.com/dofy/invite-maker';

const LayerListItem = memo(function LayerListItem({
  id,
  index,
  preview,
  selected,
  deleteLabel,
  onSelect,
  onDelete,
}: {
  id: string;
  index: number;
  preview: string;
  selected: boolean;
  deleteLabel: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={selected ? 'layer-item active' : 'layer-item'}>
      <button type="button" className="layer-select" onClick={() => onSelect(id)}>
        <span>#{index + 1}</span><span className="layer-preview">{preview}</span>
      </button>
      <ActionIcon className="layer-delete" variant="subtle" color="red" aria-label={deleteLabel} onClick={() => onDelete(id)}>
        <IconTrash size={16} />
      </ActionIcon>
    </div>
  );
});

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

export function ControlPanel({
  dataPreviewOpened,
  onDataPreviewOpenedChange,
}: {
  dataPreviewOpened: boolean;
  onDataPreviewOpenedChange: (opened: boolean) => void;
}) {
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
            <LayerListItem
              key={layer.id}
              id={layer.id}
              index={index}
              preview={layer.text || t('layers.empty')}
              selected={selectedId === layer.id}
              deleteLabel={translate(t, 'layers.deleteAria', { index: index + 1 })}
              onSelect={selectLayer}
              onDelete={setDeleteId}
            />
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
        <div className="data-preview-toolbar">
          <Text size="xs" c={binding.mode === 'conflict' ? 'red' : 'dimmed'}>{importStatus}</Text>
          {importedIsCurrent ? (
            <Button
              className="data-preview-open"
              variant="subtle"
              size="compact-sm"
              leftSection={<IconArrowsMaximize size={15} />}
              onClick={() => onDataPreviewOpenedChange(true)}
            >
              {t('data.expandPreview')}
            </Button>
          ) : null}
        </div>
        {importedIsCurrent && !dataPreviewOpened ? (
          <DataPreviewTable
            records={records}
            headers={headers}
            previewIndex={previewIndex}
            onPreview={setPreviewIndex}
            label={translate(t, 'data.previewTitle', { count: records.length })}
          />
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
          <a href="/about.html">{t('footer.about')}</a>
          <a href="/privacy.html">{t('footer.privacy')}</a>
          <a href="/terms.html">{t('footer.terms')}</a>
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
