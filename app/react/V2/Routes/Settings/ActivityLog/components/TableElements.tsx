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
type Methods = 'UPDATE' | 'DELETE';

const methodColors: Map<Methods, PillColor> = new Map([
  ['UPDATE', 'blue'],
  ['DELETE', 'red'],
]);

const ActionCell = ({ cell }: CellContext<ActivityLogEntryType, string>) => {
  const color = methodColors.get(cell.getValue() as Methods) || 'gray';
  return <Pill color={color}>{cell.getValue()}</Pill>;
};

const UserCell = ({ cell }: CellContext<ActivityLogEntryType, string>) => (
  <span>{cell.getValue()}</span>
);

const DescriptionCell = ({ cell }: CellContext<ActivityLogEntryType, ActivityLogSemanticType>) => (
  <span>{cell.getValue().description}</span>
);

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
