import React, { type ReactNode } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { CountryFlag } from '../../CustomIcons/index.js';

type RelationshipTableColumn = {
  label: string;
  cellsByEntityId?: Record<string, string | undefined>;
};

type RelationshipTableRow = {
  id: string;
  label: string;
  templateId?: string;
  authorized?: false;
  iconId?: string;
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

const cellText = (column: RelationshipTableColumn, entityId: string): string | undefined =>
  column.cellsByEntityId?.[entityId];

const RelationshipConnectionsTable = ({
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
      <div className="max-h-60 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-tertiary">
              <th className="px-3 py-1.5 text-start font-medium">
                <Translate>Entity</Translate>
              </th>
              {columns.map(column => (
                <th
                  key={column.label}
                  className="whitespace-nowrap px-3 py-1.5 text-start font-medium"
                >
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
                    {row.iconId ? <CountryFlag id={row.iconId} /> : null}
                    <TemplatePill
                      templateId={row.templateId || targetTemplateId || ''}
                      label={row.label || row.id}
                    />
                  </span>
                );
                const canOpen = row.authorized !== false && onEntityClick;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-border/40 transition-colors hover:bg-warm/30"
                  >
                    <td className="min-w-0 max-w-40 px-3 py-1.5 align-middle">
                      {canOpen ? (
                        <button
                          type="button"
                          className="inline-flex max-w-full cursor-pointer items-center rounded-md transition-opacity hover:opacity-80"
                          title={row.label || row.id}
                          onClick={() => onEntityClick(row)}
                        >
                          {pill}
                        </button>
                      ) : (
                        pill
                      )}
                    </td>
                    {columns.map(column => {
                      const cell = cellText(column, row.id);
                      return (
                        <td
                          key={`${row.id}-${column.label}`}
                          className="whitespace-nowrap border-s border-border/40 px-3 py-1.5 align-middle"
                        >
                          {cell ? (
                            <span className="text-sm font-medium text-ink">{cell}</span>
                          ) : (
                            <span className="text-xs text-ink-muted">—</span>
                          )}
                        </td>
                      );
                    })}
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

export { RelationshipConnectionsTable };
export type { RelationshipConnectionsTableProps, RelationshipTableColumn, RelationshipTableRow };
