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

const stackLabelClass =
  'min-w-0 wrap-break-word text-meta font-semibold uppercase tracking-wider text-ink-tertiary';

const cellContent = (column: RelationshipTableColumn, entityId: string): ReactNode =>
  column.cellsByEntityId?.[entityId];

const renderInheritedCell = (cell: ReactNode): ReactNode => {
  if (!cell) {
    return <span className="text-xs text-ink-muted">—</span>;
  }
  if (typeof cell === 'string') {
    return <span className="break-words text-sm font-medium text-ink">{cell}</span>;
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
    <div className="grid w-full min-w-0 grid-cols-[fit-content(40%)_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
      {rollups.map(rollup => (
        <React.Fragment key={rollup.label}>
          <span className={stackLabelClass}>
            <Translate context={translationContext}>{rollup.label}</Translate>
          </span>
          <span className="min-w-0">
            <InheritRollupChip text={rollup.text} title={rollup.title} />
          </span>
        </React.Fragment>
      ))}
      {rows.map(row => (
        <div
          key={row.id}
          className="col-span-2 grid grid-cols-subgrid items-baseline gap-y-1 rounded-md border border-border/40 px-2.5 py-2.5"
        >
          <div className="col-span-2 flex items-center justify-between gap-2">
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
          {columns.map(column => (
            <React.Fragment key={column.label}>
              <span className={stackLabelClass}>
                <Translate context={translationContext}>{column.label}</Translate>
              </span>
              <span className="min-w-0">{renderInheritedCell(cellContent(column, row.id))}</span>
            </React.Fragment>
          ))}
        </div>
      ))}
    </div>
  );
};

export { ConnectionCardStack, cellContent, renderInheritedCell };
export type { RelationshipTableColumn, RelationshipTableRow, InheritRollup };
