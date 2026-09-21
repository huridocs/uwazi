import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';
import { InheritRollupChip } from './InheritRollupChip.js';
import type { EntityIconData } from '../../CustomIcons/index.js';

type RelationshipTableColumn = {
  label: string;
  inheritedType?: string;
  cellsByEntityId?: Record<string, ReactNode>;
  sortKeyByEntityId?: Record<string, string>;
};

type RelationshipTableRow = {
  id: string;
  label: string;
  templateId?: string;
  authorized?: false;
  icon?: EntityIconData | null;
};

type InheritRollup = {
  label: string;
  text: string;
  title: string;
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

type ConnectionCardStackProps = {
  rows: RelationshipTableRow[];
  columns: RelationshipTableColumn[];
  translationContext: string;
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
  renderActions?: (row: RelationshipTableRow) => ReactNode;
  emptyLabel: string;
  rollups?: InheritRollup[];
};

const ConnectionCardStack = ({
  rows,
  columns,
  translationContext,
  targetTemplateId,
  onOpenEntity,
  renderActions,
  emptyLabel,
  rollups = [],
}: ConnectionCardStackProps) => {
  if (rows.length === 0) {
    return (
      <p className="px-3 py-2.5 text-xs text-ink-muted">
        <Translate>{emptyLabel}</Translate>
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {rollups.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {rollups.map(rollup => (
            <span key={rollup.label} className="inline-flex items-center gap-1">
              <span className="text-meta font-semibold uppercase tracking-wider text-ink-tertiary">
                <Translate context={translationContext}>{rollup.label}</Translate>
              </span>
              <InheritRollupChip text={rollup.text} title={rollup.title} />
            </span>
          ))}
        </div>
      ) : null}
      {rows.map(row => (
        <div key={row.id} className="space-y-1.5 rounded-md border border-border/40 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <EntityOverlayPill
              sharedId={row.id}
              templateId={row.templateId || targetTemplateId || ''}
              label={row.label || row.id}
              icon={row.icon}
              authorized={row.authorized}
              onOpenEntity={onOpenEntity}
            />
            {renderActions?.(row)}
          </div>
          {columns.length > 0 ? (
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
              {columns.map(column => (
                <div key={column.label} className="contents">
                  <span className="text-meta font-semibold uppercase tracking-wider text-ink-tertiary">
                    <Translate context={translationContext}>{column.label}</Translate>
                  </span>
                  <span className="min-w-0">
                    {renderInheritedCell(cellContent(column, row.id))}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export { ConnectionCardStack, cellContent, renderInheritedCell };
export type { RelationshipTableColumn, RelationshipTableRow, InheritRollup };
