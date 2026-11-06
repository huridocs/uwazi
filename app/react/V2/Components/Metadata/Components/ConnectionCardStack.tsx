import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';
import { renderPreviewCell } from './PreviewClamp.js';
import type { EntityIconData } from '../../CustomIcons/index.js';

type RelationshipTableColumn = {
  id?: string;
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

const columnKey = (column: RelationshipTableColumn) => column.id ?? column.label;

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
  preview?: boolean;
};

const ConnectionCardStack = ({
  rows,
  columns,
  translationContext,
  targetTemplateId,
  onOpenEntity,
  renderActions,
  emptyLabel,
  preview = false,
}: ConnectionCardStackProps) => {
  if (rows.length === 0) {
    return (
      <p className="px-3 py-2.5 text-xs text-ink-muted">
        <Translate>{emptyLabel}</Translate>
      </p>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {rows.map(row => (
        <div key={row.id} className="min-w-0 rounded-md border border-border/40 px-2.5 py-2.5">
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
            <div className="mt-1.5 grid grid-cols-[fit-content(40%)_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5">
              {columns.map(column => (
                <React.Fragment key={columnKey(column)}>
                  <span className={stackLabelClass}>
                    <Translate context={translationContext}>{column.label}</Translate>
                  </span>
                  <span className="min-w-0">
                    {renderPreviewCell(
                      renderInheritedCell(cellContent(column, row.id)),
                      column.inheritedType,
                      preview
                    )}
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export { ConnectionCardStack, cellContent, columnKey, renderInheritedCell };
export type { RelationshipTableColumn, RelationshipTableRow };
