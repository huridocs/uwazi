/* eslint-disable react/no-multi-comp */
import React from 'react';
import moment from 'moment';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Tooltip } from 'flowbite-react';
import { Pill, Button } from 'app/V2/Components/UI';
import type { PillColor } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ActivityLogSemanticType } from 'shared/types/activityLogEntryType';
import { LogEntry } from '../ActivityLogLoader';

const ActionHeader = () => <Translate>Action</Translate>;
const UserHeader = () => <Translate>User</Translate>;
const DescriptionHeader = () => <Translate>Description</Translate>;
const TimeHeader = () => <Translate>Timestamp</Translate>;

const columnHelper = createColumnHelper<LogEntry>();
type Methods = 'CREATE' | 'UPDATE' | 'DELETE' | 'RAW' | 'MIGRATE' | 'WARNING';

const methodColors: Map<Methods, PillColor> = new Map([
  ['CREATE', 'green'],
  ['UPDATE', 'blue'],
  ['DELETE', 'red'],
  ['RAW', 'gray'],
  ['MIGRATE', 'primary'],
  ['WARNING', 'yellow'],
]);

const ActionPill = ({ action, className = '' }: { action: string; className?: string }) => {
  const color = methodColors.get(action as Methods) || 'gray';
  return (
    <Pill className={`${className || ''} `} color={color}>
      <Translate>{action}</Translate>
    </Pill>
  );
};
const ActionCell = ({ cell }: CellContext<LogEntry, string>) => (
  <ActionPill action={cell.row.original.semantic.action} />
);

const UserCell = ({ cell }: CellContext<LogEntry, string>) => (
  <span className="text-primary-700">{cell.getValue()}</span>
);

const DescriptionCell = ({ cell }: CellContext<LogEntry, ActivityLogSemanticType>) => {
  const semanticData = cell.getValue();

  return (
    <div className="flex">
      <Tooltip
        // eslint-disable-next-line react/style-prop-object
        style="light"
        className="max-w-lg max-h-64 min-w-20"
        content={
          <div className="flex-col">
            <div className="gap-4 w-full max-h-16">
              <Translate>Query</Translate>
              <span className="block overflow-hidden text-ellipsis">{cell.row.original.query}</span>
            </div>
            <div className="gap-4 w-full max-h-48">
              <Translate>Body</Translate>
              <span className="block overflow-hidden max-h-40 text-ellipsis">
                {cell.row.original.body}
              </span>
            </div>
          </div>
        }
      >
        {semanticData.action !== 'RAW' && (
          <div className="space-x-2">
            {semanticData.description && (
              <>
                <Translate className="font-semibold">{semanticData.description}</Translate>&#58;
              </>
            )}
            {semanticData.name && <Translate>{semanticData.name}</Translate>}
            {semanticData.extra && <Translate>{semanticData.extra}</Translate>}
          </div>
        )}
        {semanticData.action === 'RAW' && (
          <div className="space-x-2">
            <Translate className="font-semibold">{cell.row.original.method}</Translate>
            <Translate>{cell.row.original.url}</Translate>
          </div>
        )}
      </Tooltip>
    </div>
  );
};

const TimeCell =
  (dateFormat: string) =>
  ({ cell }: CellContext<LogEntry, number>) => {
    const date = moment(cell.getValue());
    return (
      <>
        <span className="font-semibold">{date.format(dateFormat.toUpperCase())}</span>
        <span className="font-medium">&nbsp;-&nbsp;{date.format('hh:mm A')}</span>
      </>
    );
  };

const ViewCell = ({ cell, column }: CellContext<LogEntry, string>) => (
  <Button
    styling="light"
    className="leading-4"
    onClick={async () => column.columnDef.meta?.action?.(cell.row)}
  >
    <Translate>View</Translate>
  </Button>
);

const getActivityLogColumns = (setSelectedEntry: any, dateFormat: string) => [
  columnHelper.accessor('method', {
    header: ActionHeader,
    cell: ActionCell,
    meta: { headerClassName: 'text-center w-1/12' },
  }),
  columnHelper.accessor('username', {
    header: UserHeader,
    cell: UserCell,
    meta: { headerClassName: 'text-center w-2/12' },
  }),
  columnHelper.accessor('semantic', {
    header: DescriptionHeader,
    cell: DescriptionCell,
    enableSorting: false,
    meta: { headerClassName: 'text-center w-6/12' },
  }),
  columnHelper.accessor('time', {
    header: TimeHeader,
    cell: TimeCell(dateFormat),
    meta: { headerClassName: 'text-center w-2/12' },
  }),
  columnHelper.accessor('_id', {
    header: () => null,
    cell: ViewCell,
    meta: {
      action: setSelectedEntry,
      headerClassName: 'sr-only invisible bg-gray-50 w-1/12',
      contentClassName: 'text-center w-1/12',
    },
  }),
];

export { getActivityLogColumns, ActionPill };
