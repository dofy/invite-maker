import { memo, useEffect } from 'react';
import { Button, Modal, ScrollArea, Table, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { translate } from '../i18n';
import { analyzeBindings } from '../lib/template';
import type { BatchRecord } from '../model';
import { useEditorStore } from '../store/editor';

interface DataPreviewTableProps {
  records: BatchRecord[];
  headers: string[];
  previewIndex: number;
  onPreview: (index: number) => void;
  expanded?: boolean;
  label: string;
}

export const DataPreviewTable = memo(function DataPreviewTable({
  records,
  headers,
  previewIndex,
  onPreview,
  expanded = false,
  label,
}: DataPreviewTableProps) {
  const selectAndFocusRow = (event: React.KeyboardEvent<HTMLTableRowElement>, index: number) => {
    const rowGroup = event.currentTarget.parentElement;
    onPreview(index);
    requestAnimationFrame(() => (rowGroup?.children[index] as HTMLElement | undefined)?.focus());
  };

  return (
    <ScrollArea
      className={`data-table-wrap ${expanded ? 'data-table-expanded' : 'data-table-inline'}`}
      type="auto"
      scrollbars="xy"
      offsetScrollbars="present"
    >
      <Table className="data-preview-table" striped highlightOnHover stickyHeader aria-label={label}>
        <Table.Thead>
          <Table.Tr><Table.Th>#</Table.Th>{headers.map((header) => <Table.Th key={header}>{header}</Table.Th>)}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {records.map((record, index) => (
            <Table.Tr
              key={index}
              className={previewIndex === index ? 'preview-row' : undefined}
              tabIndex={previewIndex === index ? 0 : -1}
              aria-selected={previewIndex === index}
              onClick={() => onPreview(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onPreview(index);
                  return;
                }

                const nextIndex = event.key === 'ArrowDown'
                  ? Math.min(records.length - 1, index + 1)
                  : event.key === 'ArrowUp'
                    ? Math.max(0, index - 1)
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? records.length - 1
                        : null;
                if (nextIndex === null) return;
                event.preventDefault();
                selectAndFocusRow(event, nextIndex);
              }}
            >
              <Table.Td>{index + 1}</Table.Td>
              {headers.map((header) => <Table.Td key={header}>{record[header]}</Table.Td>)}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
});

function useDataPreviewState() {
  const records = useEditorStore((state) => state.records);
  const headers = useEditorStore((state) => state.headers);
  const importedSignature = useEditorStore((state) => state.importedSignature);
  const bindingSignature = useEditorStore((state) => analyzeBindings(state.layers).signature);
  const previewIndex = useEditorStore((state) => state.previewIndex);
  const setPreviewIndex = useEditorStore((state) => state.setPreviewIndex);

  return {
    records,
    headers,
    previewIndex,
    setPreviewIndex,
    importedIsCurrent: records.length > 0 && importedSignature === bindingSignature,
  };
}

function DataPreviewSidebar({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { records, headers, previewIndex, setPreviewIndex, importedIsCurrent } = useDataPreviewState();
  const title = translate(t, 'data.previewTitle', { count: records.length });

  useEffect(() => {
    if (!importedIsCurrent) onClose();
  }, [importedIsCurrent, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!importedIsCurrent) return null;

  return (
    <aside className="data-preview-sidebar" aria-label={title}>
      <header className="data-preview-sidebar-header">
        <Button
          className="data-preview-sidebar-back"
          variant="subtle"
          size="compact-sm"
          leftSection={<IconArrowLeft size={17} />}
          onClick={onClose}
        >
          {t('data.closePreview')}
        </Button>
        <div className="data-preview-sidebar-heading">
          <Text fw={700}>{title}</Text>
          <Text size="xs" c="dimmed">{t('data.hint')}</Text>
        </div>
      </header>
      <div className="data-preview-sidebar-body">
        <DataPreviewTable
          records={records}
          headers={headers}
          previewIndex={previewIndex}
          onPreview={setPreviewIndex}
          expanded
          label={title}
        />
      </div>
    </aside>
  );
}

function DataPreviewModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { records, headers, previewIndex, setPreviewIndex, importedIsCurrent } = useDataPreviewState();
  const title = translate(t, 'data.previewTitle', { count: records.length });

  useEffect(() => {
    if (!importedIsCurrent) onClose();
  }, [importedIsCurrent, onClose]);

  return (
    <Modal
      opened={importedIsCurrent}
      onClose={onClose}
      title={title}
      fullScreen
      classNames={{ content: 'data-preview-modal-content', body: 'data-preview-modal-body' }}
    >
      <DataPreviewTable
        records={records}
        headers={headers}
        previewIndex={previewIndex}
        onPreview={setPreviewIndex}
        expanded
        label={title}
      />
    </Modal>
  );
}

export function ExpandedDataPreview({ onClose }: { onClose: () => void }) {
  const compact = useMediaQuery('(max-width: 1199px)', false, { getInitialValueInEffect: true });
  return compact
    ? <DataPreviewModal onClose={onClose} />
    : <DataPreviewSidebar onClose={onClose} />;
}
