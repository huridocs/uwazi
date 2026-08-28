import React, { memo, type ReactNode } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { EntityIcon, type EntityIconData } from '../../CustomIcons/index.js';
import { inheritedTypeLayout } from '../inheritedTypeLayout.js';

const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';

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
  onEntityClick?: (row: RelationshipTableRow) => void;
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

const entityCellForRow = (
  row: RelationshipTableRow,
  pill: ReactNode,
  onEntityClick?: (row: RelationshipTableRow) => void
): ReactNode => {
  if (row.authorized === false) {
    return pill;
  }
  const title = row.label || row.id;
  if (onEntityClick) {
    return (
      <button
        type="button"
        className="inline-flex max-w-full cursor-pointer items-center rounded-md transition-opacity hover:opacity-80"
        title={title}
        onClick={() => onEntityClick(row)}
      >
        {pill}
      </button>
    );
  }
  return (
    <I18NLinkV2
      className="inline-flex max-w-full items-center rounded-md transition-opacity hover:opacity-80"
      to={`${DEFAULT_ENTITY_BASE_PATH}${row.id}`}
      target="_blank"
      rel="noreferrer"
      localized={false}
      title={title}
    >
      {pill}
    </I18NLinkV2>
  );
};

const RelationshipConnectionsTableComponent = ({
  rows,
  columns = [],
  translationContext = 'System',
  targetTemplateId,
  onEntityClick,
  renderActions,
  emptyLabel = 'No connected entities yet.',
}: RelationshipConnectionsTableProps) => {
  const actionCol = Boolean(renderActions);
  const colSpan = columns.length + 1 + (actionCol ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-tertiary">
              <th className="px-3 py-1.5 text-start font-medium">
                <Translate>Entity</Translate>
              </th>
              {columns.map(column => (
                <th key={column.label} className={inheritColumnHeaderClass(column.inheritedType)}>
                  <span className="inline-flex items-center gap-1">
                    <LinkIcon className="h-2.5 w-2.5 text-carbon" aria-hidden />
                    <Translate context={translationContext}>{column.label}</Translate>
                  </span>
                </th>
              ))}
              {actionCol ? <th className="sticky right-0 w-0 bg-paper px-2" aria-hidden /> : null}
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
              rows.map(row => {
                const pill = (
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <EntityIcon data={row.icon} />
                    <TemplatePill
                      templateId={row.templateId || targetTemplateId || ''}
                      label={row.label || row.id}
                    />
                  </span>
                );
                return (
                  <tr
                    key={row.id}
                    className="border-t border-border/40 transition-colors hover:bg-warm/30"
                  >
                    <td className="max-w-40 px-3 py-1.5 align-middle">
                      {entityCellForRow(row, pill, onEntityClick)}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RelationshipConnectionsTable = memo(RelationshipConnectionsTableComponent);

export { RelationshipConnectionsTable };
export type { RelationshipConnectionsTableProps, RelationshipTableColumn, RelationshipTableRow };
