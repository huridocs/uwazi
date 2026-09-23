import React, { memo, useMemo, useRef, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { inheritedTypeLayout } from '../inheritedTypeLayout.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';
import {
  ConnectionCardStack,
  cellContent,
  renderInheritedCell,
  type RelationshipTableColumn,
  type RelationshipTableRow,
} from './ConnectionCardStack.js';
import { InheritRollupChip } from './InheritRollupChip.js';
import { distinctRollup, mergeConnectionRows } from './mergeConnectionRows.js';
import { useTableFitsContainer } from './useTableFitsContainer.js';

const inheritedCellClass = (inheritedType?: string) =>
  `${inheritedTypeLayout(inheritedType).minWidthClass} border-t border-s border-border/40 px-3 py-1.5 align-middle first:border-s-0`;

const inheritColumnHeaderClass = (inheritedType?: string) =>
  `${inheritedTypeLayout(inheritedType).minWidthClass} whitespace-nowrap px-3 py-1.5 text-start font-semibold`;

const inheritView = (rows: RelationshipTableRow[], columns: RelationshipTableColumn[]) => {
  const summaries = columns.map(column => distinctRollup(rows, column));
  return {
    mergedRows: mergeConnectionRows(rows, columns),
    summaries,
    rollups: summaries.flatMap((summary, index) => {
      const column = columns[index];
      return summary && column ? [{ label: column.label, ...summary }] : [];
    }),
  };
};

type RelationshipConnectionsTableProps = {
  rows: RelationshipTableRow[];
  columns?: RelationshipTableColumn[];
  translationContext?: string;
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  renderActions?: (row: RelationshipTableRow) => ReactNode;
  emptyLabel?: string;
};

const RelationshipConnectionsTableComponent = ({
  rows,
  columns = [],
  translationContext = 'System',
  targetTemplateId,
  onOpenEntity,
  renderActions,
  emptyLabel = 'No connected entities yet.',
}: RelationshipConnectionsTableProps) => {
  const templates = useAtomValue(templatesAtom);
  const entityHeader =
    templates.find(template => template._id === targetTemplateId)?.name || 'Entity';
  const actionCol = Boolean(renderActions);
  const colSpan = columns.length + 1 + (actionCol ? 1 : 0);
  const { mergedRows, summaries, rollups } = useMemo(
    () => inheritView(rows, columns),
    [columns, rows]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLTableElement>(null);
  const showCards = useTableFitsContainer(containerRef, probeRef);

  return (
    <div
      ref={containerRef}
      data-testid="relationship-connections"
      data-connections-root
      className="relative min-w-0 w-full"
    >
      <div
        className={
          showCards
            ? 'invisible pointer-events-none absolute start-0 top-0'
            : 'max-w-full overflow-x-auto'
        }
      >
        <table
          ref={probeRef}
          data-connections-probe
          className="w-max border-collapse text-sm"
          aria-hidden={showCards || undefined}
        >
          <caption className="sr-only">
            <Translate>Connected entities</Translate>
            {columns.length > 0 ? ` — ${columns.map(column => column.label).join(', ')}` : null}
          </caption>
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-tertiary">
              {columns.map((column, index) => {
                const summary = summaries[index];
                return (
                  <th
                    key={column.label}
                    scope="col"
                    className={inheritColumnHeaderClass(column.inheritedType)}
                  >
                    <span className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-1">
                        <LinkIcon className="h-2.5 w-2.5 text-carbon" aria-hidden />
                        <Translate context={translationContext}>{column.label}</Translate>
                      </span>
                      {summary ? (
                        <InheritRollupChip text={summary.text} title={summary.title} />
                      ) : null}
                    </span>
                  </th>
                );
              })}
              <th scope="col" className="px-1 py-1.5 text-start font-semibold">
                <Translate>{entityHeader}</Translate>
              </th>
              {actionCol ? (
                <th scope="col" className="sticky right-0 w-0 bg-paper px-2" aria-hidden />
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="border-t border-border/40 px-3 py-2.5 text-xs text-ink-muted"
                >
                  <Translate>{emptyLabel}</Translate>
                </td>
              </tr>
            ) : (
              mergedRows.map(({ row, cells }) => (
                <tr key={row.id} className="transition-colors hover:bg-warm/30">
                  {cells.flatMap(cell => {
                    if (!cell.lead) return [];
                    const column = columns[cell.columnIndex];
                    if (!column) return [];
                    return [
                      <td
                        key={`${row.id}-${column.label}`}
                        rowSpan={cell.rowSpan}
                        className={inheritedCellClass(column.inheritedType)}
                      >
                        {renderInheritedCell(cellContent(column, row.id))}
                      </td>,
                    ];
                  })}
                  <td className="max-w-40 border-t border-s border-border/40 px-1 py-1.5 align-middle">
                    <EntityOverlayPill
                      sharedId={row.id}
                      templateId={row.templateId || targetTemplateId || ''}
                      label={row.label || row.id}
                      icon={row.icon}
                      authorized={row.authorized}
                      onOpenEntity={onOpenEntity}
                    />
                  </td>
                  {actionCol ? (
                    <td className="border-s border-t border-border/40 bg-paper px-2 py-1 align-middle">
                      {renderActions?.(row)}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showCards ? (
        <div data-testid="connection-card-stack">
          <ConnectionCardStack
            rows={rows}
            columns={columns}
            translationContext={translationContext}
            targetTemplateId={targetTemplateId}
            onOpenEntity={onOpenEntity}
            renderActions={renderActions}
            emptyLabel={emptyLabel}
            rollups={rollups}
          />
        </div>
      ) : null}
    </div>
  );
};

const RelationshipConnectionsTable = memo(RelationshipConnectionsTableComponent);

export { RelationshipConnectionsTable };
export type { RelationshipConnectionsTableProps };
export type { RelationshipTableColumn, RelationshipTableRow } from './ConnectionCardStack.js';
