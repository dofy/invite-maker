import { memo, useRef, useState } from 'react';
import {
  ActionIcon,
  Autocomplete,
  Button,
  ColorInput,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Text,
  Textarea,
  Tooltip,
} from '@mantine/core';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCalendar,
  IconChevronDown,
  IconClock,
  IconFileDescription,
  IconFingerprint,
  IconTransferOut,
  IconTypography,
} from '@tabler/icons-react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { translate } from '../i18n';
import type { AnchorX, AnchorY, HorizontalAlign, TextLayer } from '../model';
import { useEditorStore } from '../store/editor';
import { Helper, SectionTitle } from './PanelPrimitives';

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
      { value: '"Noto Sans TC","PingFang TC",sans-serif', label: 'Noto Sans TC' },
      { value: '"Noto Serif SC","Songti SC",serif', label: 'Noto Serif SC' },
      { value: '"Noto Serif TC","Songti TC",serif', label: 'Noto Serif TC' },
      { value: '"LXGW WenKai","Kaiti SC",serif', label: 'LXGW WenKai' },
      { value: '"Ma Shan Zheng","Kaiti SC",cursive', label: 'Ma Shan Zheng' },
      { value: '"Long Cang","Kaiti SC",cursive', label: 'Long Cang' },
      { value: '"ZCOOL XiaoWei","Songti SC",serif', label: 'ZCOOL XiaoWei' },
    ] },
    { group: t('editor.fontGroupLatin'), items: [
      { value: 'Montserrat,"Helvetica Neue",sans-serif', label: 'Montserrat' },
      { value: '"Great Vibes","Brush Script MT",cursive', label: `Great Vibes · ${t('editor.fontGreatVibes')}` },
      { value: 'Sacramento,"Brush Script MT",cursive', label: 'Sacramento' },
      { value: '"Playfair Display",Georgia,serif', label: `Playfair Display · ${t('editor.fontPlayfair')}` },
      { value: '"Cormorant Garamond",Garamond,serif', label: `Cormorant Garamond · ${t('editor.fontCormorant')}` },
      { value: 'Cinzel,Georgia,serif', label: 'Cinzel' },
    ] },
    { group: t('editor.fontGroupJapanese'), items: [
      { value: '"Noto Sans JP","Yu Gothic",sans-serif', label: 'Noto Sans JP' },
      { value: '"Noto Serif JP","Yu Mincho",serif', label: 'Noto Serif JP' },
      { value: '"Shippori Mincho","Yu Mincho",serif', label: 'Shippori Mincho' },
      { value: '"Zen Kurenaido","Yu Mincho",serif', label: 'Zen Kurenaido' },
    ] },
    { group: t('editor.fontGroupKorean'), items: [
      { value: '"Noto Sans KR","Apple SD Gothic Neo",sans-serif', label: 'Noto Sans KR' },
      { value: '"Noto Serif KR","AppleMyungjo",serif', label: 'Noto Serif KR' },
      { value: '"Gowun Batang","AppleMyungjo",serif', label: 'Gowun Batang' },
      { value: '"Song Myung","AppleMyungjo",serif', label: 'Song Myung' },
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

export const LayerEditor = memo(function LayerEditor({ layer }: { layer: TextLayer }) {
  const { t } = useTranslation();
  const updateLayer = useEditorStore((state) => state.updateLayer);
  const headers = useEditorStore((state) => state.headers);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvField, setCsvField] = useState('');
  const [csvDropdownOpened, setCsvDropdownOpened] = useState(false);
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

  const insertCsvToken = () => {
    const field = csvField.trim();
    if (field) insertToken(`{{csv.${field}}}`);
  };

  const insertIndexToken = () => {
    const width = Math.max(1, Math.min(12, Number(indexWidth) || 1));
    insertToken(`{{index:${width}}}`);
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
      <Autocomplete
        ref={csvInputRef}
        label={t('editor.csvAria')}
        value={csvField}
        onChange={setCsvField}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            setCsvDropdownOpened(false);
            insertCsvToken();
          }
        }}
        data={headers}
        dropdownOpened={csvDropdownOpened && headers.length > 0}
        onDropdownOpen={() => headers.length > 0 && setCsvDropdownOpened(true)}
        onDropdownClose={() => setCsvDropdownOpened(false)}
        onOptionSubmit={() => setCsvDropdownOpened(false)}
        placeholder={t('editor.csvPlaceholder')}
        rightSectionPointerEvents="all"
        rightSectionWidth={headers.length > 0 ? 72 : 40}
        rightSection={(
          <Group className="csv-field-actions" gap={2} wrap="nowrap">
            {headers.length > 0 ? (
              <ActionIcon
                className="csv-suggestions-action"
                size="sm"
                variant="subtle"
                aria-label={t('editor.csvAria')}
                aria-expanded={csvDropdownOpened}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setCsvDropdownOpened((opened) => !opened);
                  csvInputRef.current?.focus();
                }}
              >
                <IconChevronDown className={csvDropdownOpened ? 'csv-field-chevron open' : 'csv-field-chevron'} size={17} />
              </ActionIcon>
            ) : null}
            <Tooltip label={t('editor.csvInsert')}>
              <ActionIcon className="input-insert-action" size="sm" variant="subtle" disabled={!csvField.trim()} aria-label={t('editor.csvInsert')} onClick={insertCsvToken}>
                <IconTransferOut size={17} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      />
      <NumberInput
        value={indexWidth}
        onChange={setIndexWidth}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            insertIndexToken();
          }
        }}
        min={1}
        max={12}
        label={t('editor.indexDigits')}
        hideControls
        rightSectionPointerEvents="all"
        rightSectionWidth={40}
        rightSection={(
          <Tooltip label={t('editor.indexInsert')}>
            <ActionIcon className="input-insert-action" size="sm" variant="subtle" aria-label={t('editor.indexInsert')} onClick={insertIndexToken}>
              <IconTransferOut size={17} />
            </ActionIcon>
          </Tooltip>
        )}
      />
      <Helper>{t('editor.example')}</Helper>

      <Select
        label={t('editor.font')}
        value={layer.font}
        onChange={(font) => font && update({ font })}
        data={fontOptions(t)}
        allowDeselect={false}
        styles={{ input: { fontFamily: layer.font } }}
        renderOption={({ option }) => <span style={{ fontFamily: option.value }}>{option.label}</span>}
      />
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
}, (previous, next) => {
  // Canvas dragging only changes x/y; none of the editor controls read those fields.
  const a = previous.layer;
  const b = next.layer;
  return a.id === b.id
    && a.text === b.text
    && a.size === b.size
    && a.width === b.width
    && a.weight === b.weight
    && a.color === b.color
    && a.align === b.align
    && a.anchorX === b.anchorX
    && a.anchorY === b.anchorY
    && a.spacing === b.spacing
    && a.stroke === b.stroke
    && a.strokeW === b.strokeW
    && a.font === b.font;
});
