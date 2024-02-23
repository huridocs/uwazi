/* eslint-disable react/no-multi-comp */
import React, { Dispatch, SetStateAction } from 'react';
import { CellContext, createColumnHelper } from '@tanstack/react-table';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Paginator, Pill, Table, Button } from 'app/V2/Components/UI';
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

interface ActivityLogTableProps {
  data: ActivityLogEntryType[];
  totalPages: number;
  setSelectedEntry: Dispatch<SetStateAction<ActivityLogEntryType | null>>;
}

const ActivityLogTable = ({ data, totalPages, setSelectedEntry }: ActivityLogTableProps) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const columns = [
    columnHelper.accessor('method', {
      header: ActionHeader,
      cell: ActionCell,
      meta: { headerClassName: 'w-0 text-center' },
    }),
    columnHelper.accessor('username', {
      header: UserHeader,
      cell: UserCell,
      meta: { headerClassName: 'w-0 text-center' },
    }),
    columnHelper.accessor('semantic', {
      header: DescriptionHeader,
      cell: DescriptionCell,
      meta: { headerClassName: 'w-0 text-center' },
    }),
    columnHelper.accessor('time', {
      header: TimeHeader,
      cell: TimeCell,
      meta: { headerClassName: 'w-0 text-center' },
    }),
    columnHelper.accessor('_id', {
      header: () => null,
      cell: ViewCell,
      meta: { action: setSelectedEntry, headerClassName: 'hidden' },
    }),
  ];
  return (
    <Table<ActivityLogEntryType>
      columns={columns}
      data={data}
      title={<Translate>Activity Log</Translate>}
      footer={
        <div className="flex justify-between h-6">
          <div className="">total pages</div>
          <div>
            <Paginator
              totalPages={totalPages}
              currentPage={searchParams.has('page') ? Number(searchParams.get('page')) : 1}
              buildUrl={(page: any) => {
                const innerSearchParams = new URLSearchParams(location.search);
                innerSearchParams.delete('page');
                innerSearchParams.set('page', page);
                return `${location.pathname}?${innerSearchParams.toString()}`;
              }}
            />
          </div>
        </div>
      }
    />
  );
};

export { ActivityLogTable };
