import React, { memo, useMemo, useRef, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';
import {
  ConnectionCardStack,
  cellContent,
  renderInheritedCell,
  type RelationshipTableColumn,
  type RelationshipTableRow,
} from './ConnectionCardStack.js';
import { mergeConnectionRows } from './mergeConnectionRows.js';
import { renderPreviewCell } from './PreviewClamp.js';
import { useTableFitsContainer } from './useTableFitsContainer.js';

const headerClass =
  'min-w-0 break-words py-1.5 text-start text-meta font-semibold uppercase tracking-wider text-ink-tertiary';

const inheritedCellClass =
  'min-w-0 break-words border-s border-t border-border/40 px-3 py-1.5 align-middle';

const entityCellClass = 'min-w-0 break-words border-t border-border/40 px-1 py-1.5 align-middle';

const connectedEntity = (
  row: RelationshipTableRow,
  targetTemplateId?: string,
  onOpenEntity?: (target: OpenEntityTarget) => void
) => (
  <EntityOverlayPill
    sharedId={row.id}
    templateId={row.templateId || targetTemplateId || ''}
    label={row.label || row.id}
    icon={row.icon}
    authorized={row.authorized}
    onOpenEntity={onOpenEntity}
  />
);

type ConnectionsTableProps = {
  columns: RelationshipTableColumn[];
  rows: RelationshipTableRow[];
  mergedRows: ReturnType<typeof mergeConnectionRows>;
  entityHeader: string;
  actionCol: boolean;
  colSpan: number;
  translationContext: string;
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  renderActions?: (row: RelationshipTableRow) => ReactNode;
  emptyLabel: string;
  preview: boolean;
};

const connectionsTable = ({
  columns,
  rows,
  mergedRows,
  entityHeader,
  actionCol,
  colSpan,
  translationContext,
  targetTemplateId,
  onOpenEntity,
  renderActions,
  emptyLabel,
  preview,
}: ConnectionsTableProps) => (
  <table className="w-full border-collapse text-sm">
    <caption className="sr-only">
      <Translate>Connected entities</Translate>
      {columns.length > 0 ? ` — ${columns.map(column => column.label).join(', ')}` : null}
    </caption>
    <thead>
      <tr>
        <th scope="col" className={`${headerClass} px-1`}>
          <Translate>{entityHeader}</Translate>
        </th>
        {columns.map(column => (
          <th key={column.label} scope="col" className={`${headerClass} px-3`}>
            <span className="inline-flex min-w-0 items-center gap-1">
              <LinkIcon className="h-2.5 w-2.5 shrink-0 text-carbon" aria-hidden />
              <Translate context={translationContext}>{column.label}</Translate>
            </span>
          </th>
        ))}
        {actionCol ? <th scope="col" className="w-0 px-2" aria-hidden /> : null}
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td colSpan={colSpan} className={`${inheritedCellClass} text-xs text-ink-muted`}>
            <Translate>{emptyLabel}</Translate>
          </td>
        </tr>
      ) : (
        mergedRows.map(({ row, cells }) => (
          <tr key={row.id} className="transition-colors hover:bg-warm/30">
            <td className={entityCellClass}>
              {connectedEntity(row, targetTemplateId, onOpenEntity)}
            </td>
            {cells.flatMap(cell => {
              if (!cell.lead) return [];
              const column = columns[cell.columnIndex];
              if (!column) return [];
              return [
                <td
                  key={`${row.id}-${column.label}`}
                  rowSpan={cell.rowSpan}
                  className={inheritedCellClass}
                >
                  {renderPreviewCell(
                    renderInheritedCell(cellContent(column, row.id)),
                    column.inheritedType,
                    preview
                  )}
                </td>,
              ];
            })}
            {actionCol ? (
              <td className="border-s border-t border-border/40 px-2 py-1 align-middle">
                {renderActions?.(row)}
              </td>
            ) : null}
          </tr>
        ))
      )}
    </tbody>
  </table>
);

type RelationshipConnectionsTableProps = {
  rows: RelationshipTableRow[];
  columns?: RelationshipTableColumn[];
  translationContext?: string;
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  renderActions?: (row: RelationshipTableRow) => ReactNode;
  emptyLabel?: string;
  preview?: boolean;
};

const RelationshipConnectionsTableComponent = ({
  rows,
  columns = [],
  translationContext = 'System',
  targetTemplateId,
  onOpenEntity,
  renderActions,
  emptyLabel = 'No connected entities yet.',
  preview = false,
}: RelationshipConnectionsTableProps) => {
  const templates = useAtomValue(templatesAtom);
  const entityHeader =
    templates.find(template => template._id === targetTemplateId)?.name || 'Entity';
  const actionCol = Boolean(renderActions);
  const colSpan = columns.length + 1 + (actionCol ? 1 : 0);
  const mergedRows = useMemo(() => mergeConnectionRows(rows, columns), [columns, rows]);
  const containerRef = useRef<HTMLDivElement>(null);
  const layout = useTableFitsContainer(containerRef);

  return (
    <div
      ref={containerRef}
      data-testid="relationship-connections"
      data-connections-root
      className="min-w-0 w-full"
    >
      {layout === 'stack' ? (
        <div data-testid="connection-card-stack">
          <ConnectionCardStack
            rows={rows}
            columns={columns}
            translationContext={translationContext}
            targetTemplateId={targetTemplateId}
            onOpenEntity={onOpenEntity}
            renderActions={renderActions}
            emptyLabel={emptyLabel}
            preview={preview}
          />
        </div>
      ) : (
        connectionsTable({
          columns,
          rows,
          mergedRows,
          entityHeader,
          actionCol,
          colSpan,
          translationContext,
          targetTemplateId,
          onOpenEntity,
          renderActions,
          emptyLabel,
          preview,
        })
      )}
    </div>
  );
};

const RelationshipConnectionsTable = memo(RelationshipConnectionsTableComponent);

export { RelationshipConnectionsTable };
export type { RelationshipConnectionsTableProps };
export type { RelationshipTableColumn, RelationshipTableRow } from './ConnectionCardStack.js';
