import React, { memo, type ReactNode } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { inheritedTypeLayout } from '../inheritedTypeLayout.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';
import type { EntityIconData } from '../../CustomIcons/index.js';

type RelationshipTableColumn = {
  label: string;
  inheritedType?: string;
  cellsByEntityId?: Record<string, ReactNode>;
};

const inheritedCellClass = (inheritedType?: string) =>
  `${inheritedTypeLayout(inheritedType).minWidthClass} border-s border-border/40 px-3 py-1.5 align-middle`;

const inheritColumnHeaderClass = (inheritedType?: string) =>
  `${inheritedTypeLayout(inheritedType).minWidthClass} whitespace-nowrap px-3 py-1.5 text-start font-medium`;

type RelationshipTableRow = {
  id: string;
  label: string;
  templateId?: string;
  authorized?: false;
  icon?: EntityIconData | null;
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

const cellContent = (column: RelationshipTableColumn, entityId: string): ReactNode =>
  column.cellsByEntityId?.[entityId];

const renderInheritedCell = (cell: ReactNode): ReactNode => {
  if (!cell) {
    return <span className="text-xs text-ink-muted">—</span>;
  }
  if (typeof cell === 'string') {
    return <span className="whitespace-nowrap text-sm font-medium text-ink">{cell}</span>;
  }
  return cell;
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
  const actionCol = Boolean(renderActions);
  const colSpan = columns.length + 1 + (actionCol ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-max min-w-full border-collapse text-sm">
        <caption className="sr-only">
          <Translate>Connected entities</Translate>
          {columns.length > 0 ? ` — ${columns.map(column => column.label).join(', ')}` : null}
        </caption>
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-ink-tertiary">
            <th scope="col" className="px-3 py-1.5 text-start font-medium">
              <Translate>Entity</Translate>
            </th>
            {columns.map(column => (
              <th
                key={column.label}
                scope="col"
                className={inheritColumnHeaderClass(column.inheritedType)}
              >
                <span className="inline-flex items-center gap-1">
                  <LinkIcon className="h-2.5 w-2.5 text-carbon" aria-hidden />
                  <Translate context={translationContext}>{column.label}</Translate>
                </span>
              </th>
            ))}
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
            rows.map(row => (
              <tr
                key={row.id}
                className="border-t border-border/40 transition-colors hover:bg-warm/30"
              >
                <td className="max-w-40 px-3 py-1.5 align-middle">
                  <EntityOverlayPill
                    sharedId={row.id}
                    templateId={row.templateId || targetTemplateId || ''}
                    label={row.label || row.id}
                    icon={row.icon}
                    authorized={row.authorized}
                    onOpenEntity={onOpenEntity}
                  />
                </td>
                {columns.map(column => (
                  <td
                    key={`${row.id}-${column.label}`}
                    className={inheritedCellClass(column.inheritedType)}
                  >
                    {renderInheritedCell(cellContent(column, row.id))}
                  </td>
                ))}
                {actionCol ? (
                  <td className="sticky right-0 border-s border-border/40 bg-paper px-2 py-1 align-middle">
                    {renderActions?.(row)}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

const RelationshipConnectionsTable = memo(RelationshipConnectionsTableComponent);

export { RelationshipConnectionsTable };
export type { RelationshipConnectionsTableProps, RelationshipTableColumn, RelationshipTableRow };
