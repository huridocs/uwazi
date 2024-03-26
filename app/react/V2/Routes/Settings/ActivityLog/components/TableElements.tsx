/* eslint-disable react/no-multi-comp */
import React from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { Pill, Button } from 'app/V2/Components/UI';
import type { PillColor } from 'app/V2/Components/UI';
import { Translate } from 'app/I18N';
import { ActivityLogEntryType, ActivityLogSemanticType } from 'shared/types/activityLogEntryType';

const ActionHeader = () => <Translate>Action</Translate>;
const UserHeader = () => <Translate>User</Translate>;
const DescriptionHeader = () => <Translate>Description</Translate>;
const TimeHeader = () => <Translate>Timestamp</Translate>;

const columnHelper = createColumnHelper<ActivityLogEntryType>();
type Methods = 'UPDATE' | 'DELETE' | 'CREATE' | 'RAW';

const methodColors: Map<Methods, PillColor> = new Map([
  ['UPDATE', 'blue'],
  ['DELETE', 'red'],
  ['CREATE', 'green'],
  ['RAW', 'gray'],
]);

const ActionCell = ({ cell }: CellContext<ActivityLogEntryType, string>) => {
  const color = methodColors.get(cell.row.original.semantic.action as Methods) || 'gray';
  return (
    <Pill className="bg-blue-100" color={color}>
      {cell.row.original.semantic.action}
    </Pill>
  );
};

const UserCell = ({ cell }: CellContext<ActivityLogEntryType, string>) => (
  <span>{cell.getValue()}</span>
);

const DescriptionCell = ({ cell }: CellContext<ActivityLogEntryType, ActivityLogSemanticType>) => {
  const semanticData = cell.getValue();

  return (
    <>
      {semanticData.action !== 'RAW' && (
        <div className="gap-5">
          {semanticData.description && (
            <Translate className="font-semibold">{semanticData.description}</Translate>
          )}
          {semanticData.name && <Translate>{semanticData.name}</Translate>}
          {semanticData.extra && <Translate>{semanticData.extra}</Translate>}
        </div>
      )}
      {semanticData.action === 'RAW' && (
        <div className="gap-5">
          <Translate className="font-semibold">{cell.row.original.method}</Translate>
          <Translate>{cell.row.original.url}</Translate>
        </div>
      )}
    </>
  );
};

const TimeCell = () => <Translate>Timestamp</Translate>;

const ViewCell = ({ cell, column }: CellContext<ActivityLogEntryType, string>) => (
  <Button
    styling="outline"
    className="leading-4"
    onClick={async () => column.columnDef.meta?.action?.(cell.row)}
  >
    <Translate>Edit</Translate>
  </Button>
);

const getActivityLogColumns = (setSelectedEntry: any) => [
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
    meta: { headerClassName: 'text-center w-7/12' },
  }),
  columnHelper.accessor('time', {
    header: TimeHeader,
    cell: TimeCell,
    meta: { headerClassName: 'text-center w-1/12' },
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

export { getActivityLogColumns };
