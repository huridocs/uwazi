import React, { useMemo } from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { BlankState } from '#V2/Components/UI/BlankState.js';
import { DataTable, EntityTypeChip, type DataTableColumn } from '#V2/Components/UI/index.js';
import { tableMinWidthRem } from '#V2/Components/UI/DataTable/tableMinWidthRem.js';
import {
  metadataDisplayPresets,
  type DisplayContext,
} from '#V2/Components/Metadata/display/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { LoadMore } from '../LoadMore.js';
import { LibraryTableCell } from '../LibraryTableCell.js';
import { formatLibraryTableDate, libraryTableCellValue } from '../libraryTableCellValue.js';
import { nextLibrarySort } from '../librarySort.js';
import { columnMatchKey, type LibraryTableColumnDef } from '../libraryTableColumns.js';
import type { LibraryViewerProps } from './types.js';

type LibraryTableRow = LibrarySearchHit & { rowId: string };

type TableViewerProps = LibraryViewerProps;

const columnHeader = (column: LibraryTableColumnDef) =>
  column.translationContext ? (
    <Translate context={column.translationContext}>{column.label}</Translate>
  ) : (
    <Translate>{column.label}</Translate>
  );

type RenderLibraryTableCellArgs = {
  row: LibraryTableRow;
  column: LibraryTableColumnDef;
  displayContext: DisplayContext;
  onFocusProperty?: (sharedId: string, fieldKey: string) => void;
};

const renderLibraryTableCell = ({
  row,
  column,
  displayContext,
  onFocusProperty,
}: RenderLibraryTableCellArgs) => {
  if (column.id === 'title') {
    return (
      <span className="flex min-w-0 items-center gap-2 overflow-visible">
        <EntityTypeChip templateId={row.template} />
        <span className="truncate font-medium text-ink" title={row.title}>
          {row.title}
        </span>
      </span>
    );
  }
  if (column.id === 'template') {
    return <TemplateLabel templateId={row.template} variant="tag" />;
  }
  if (column.id === 'creationDate' || column.id === 'editDate') {
    return (
      <LibraryTableCell
        text={formatLibraryTableDate(
          column.id === 'editDate' ? row.editDate : row.creationDate,
          displayContext
        )}
        className="tabular-nums text-ink-tertiary"
      />
    );
  }
  const formatted = libraryTableCellValue(column.type, row.metadata?.[column.id], displayContext);
  return (
    <LibraryTableCell
      text={formatted.text}
      interactive={formatted.interactive}
      onClick={() => onFocusProperty?.(row.sharedId, column.id)}
    />
  );
};

const TableViewer = ({
  rows,
  totalRows,
  selectedIds = [],
  onSelect,
  onLoadMore,
  sort,
  order = 'desc',
  onSortChange,
  onFocusProperty,
  tableColumns = [],
  tableDensity = 'compact',
}: TableViewerProps) => {
  const locale = useAtomValue(localeAtom) || 'en';
  const displayContext = useMemo(() => ({ ...metadataDisplayPresets.compact, locale }), [locale]);

  const data = useMemo<LibraryTableRow[]>(
    () => rows.map(row => ({ ...row, rowId: row.sharedId })),
    [rows]
  );

  const columns = useMemo<DataTableColumn<LibraryTableRow>[]>(
    () =>
      tableColumns.map(column => ({
        id: columnMatchKey(column),
        header: columnHeader(column),
        width: column.width,
        align: column.align,
        sortKey: column.sortKey,
        cell: row => renderLibraryTableCell({ row, column, displayContext, onFocusProperty }),
      })),
    [displayContext, onFocusProperty, tableColumns]
  );

  const sortState = { key: sort || 'creationDate', dir: order };

  if (rows.length === 0) {
    return (
      <BlankState
        icon={<FolderIcon className="h-8 w-8 text-ink-muted" />}
        title={<Translate>No entities found</Translate>}
        description={<Translate>Try a different search or clear filters.</Translate>}
      />
    );
  }

  return (
    <>
      <div
        data-testid="library-table"
        onMouseDown={event => {
          if (event.shiftKey) {
            event.preventDefault();
          }
        }}
      >
        <DataTable
          columns={columns}
          data={data}
          density={tableDensity}
          selectedRowIds={selectedIds}
          onRowClick={(row, event) =>
            onSelect(row.sharedId, {
              shiftKey: event.shiftKey,
              ctrlKey: event.ctrlKey,
              metaKey: event.metaKey,
            })
          }
          sort={sortState}
          onSort={
            onSortChange
              ? key => {
                  const next = nextLibrarySort(sort || '', order, key);
                  onSortChange(next.sort, next.order);
                }
              : undefined
          }
          minWidthRem={tableMinWidthRem(columns)}
        />
      </div>
      <LoadMore loaded={rows.length} total={totalRows} onLoadMore={onLoadMore} />
    </>
  );
};

export type { TableViewerProps };
export { TableViewer };
