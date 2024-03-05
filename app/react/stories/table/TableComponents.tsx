/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { CellContext, createColumnHelper, PaginationState, Row } from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { EmbededButton, Table, TableProps, Button } from 'V2/Components/UI';
import { get } from 'lodash';

type SampleSchema = {
  title: string;
  description: string;
  created: number;
  children?: SampleSchema[];
};

const columnHelper = createColumnHelper<SampleSchema>();
const CustomCell = ({ cell }: CellContext<SampleSchema, any>) => (
  <div className="text-center text-white bg-gray-400 rounded">{cell.getValue()}</div>
);

const ActionsCell = () => (
  <div className="flex gap-1">
    <Button>Primary</Button>
    <Button styling="outline">Secondary</Button>
  </div>
);

const StoryComponent = (props: TableProps<SampleSchema> & { showUpdates?: boolean }) => {
  const [tableState, setTableState] = useState<SampleSchema[]>(props.data);
  const [firstLoad, setFirstLoad] = useState(true);

  const onChangeHandler = (data: SampleSchema[]) => {
    setTableState(data);
    setFirstLoad(false);
  };

  return (
    <>
      <div className="tw-content">
        <Table<SampleSchema>
          columns={props.columns}
          data={tableState}
          title={props.title}
          initialState={props.initialState}
          footer={props.footer}
          setSorting={props.setSorting}
          draggableRows={props.draggableRows === true}
          onChange={onChangeHandler}
          subRowsKey={props.subRowsKey}
        />
      </div>
      {props.showUpdates === true && !firstLoad && (
        <div data-testid="update_items">
          <span>Updated state</span>
          <ul>
            {tableState?.map((item: SampleSchema, index: number) => {
              const children = props.subRowsKey
                ? (get(item, props.subRowsKey) || []).map((child: SampleSchema) => child.title)
                : [];
              return (
                // eslint-disable-next-line react/no-array-index-key
                <li key={`item_${index}`}>{`${item.title} ${children.join(', ')}`}</li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

const updatedData = [
  { title: 'Entity 2', created: 2, description: 'Short text' },
  {
    title: 'Entity 3',
    created: 3,
    description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
  },
];

const CheckboxesTableComponent = (args: TableProps<SampleSchema>) => {
  const [selected1, setSelected1] = useState<Row<SampleSchema>[]>([]);
  const [selected2, setSelected2] = useState<Row<SampleSchema>[]>([]);
  const [table2Data, setTable2Data] = useState(args.data);

  return (
    <div className="tw-content">
      <Table<SampleSchema>
        columns={args.columns}
        data={args.data}
        title="Table A"
        enableSelection
        onSelection={setSelected1}
        draggableRows={args.draggableRows}
      />

      <p className="m-1">Selected items for Table A: {selected1.length}</p>
      <p className="m-1">
        Selections of Table A: {selected1.map(sel => `${sel.original.title}, `)}
      </p>

      <hr className="m-4" />

      <Table<SampleSchema>
        columns={args.columns}
        data={table2Data}
        title="Table B"
        enableSelection
        onSelection={setSelected2}
        draggableRows={args.draggableRows}
      />

      <p className="m-1">Selected items for Table B: {selected2.length}</p>
      <p className="m-1">
        Selections of Table B: {selected2.map(sel => `${sel.original.title}, `)}
      </p>

      <div className="flex gap-1">
        <button
          type="button"
          className="p-2 text-white rounded border bg-primary-600"
          onClick={() => setTable2Data(updatedData)}
        >
          Update table data
        </button>

        <button
          type="button"
          className="p-2 text-white rounded border bg-primary-600"
          onClick={() => setTable2Data(args.data)}
        >
          Reset table data
        </button>
      </div>
    </div>
  );
};

const PaginationTableComponent = (args: TableProps<SampleSchema>) => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  return (
    <div className="tw-content">
      <Table<SampleSchema>
        columns={args.columns}
        data={args.data}
        title="Table with pagination"
        enableSelection
        footer="This is the table footer"
        pagination={{
          state: pagination,
          setState: setPagination,
        }}
      />
    </div>
  );
};

const TitleCell = ({ row, getValue }: CellContext<SampleSchema, string>) => (
  <div className="flex gap-2 items-center">
    <span className={row.getIsExpanded() ? 'text-indigo-900' : 'text-indigo-800'}>
      {getValue()}
    </span>
    {row.getCanExpand() && (
      <EmbededButton
        icon={row.getIsExpanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
        onClick={() => row.toggleExpanded()}
        color="indigo"
        data-test-id="chevron-icon"
      >
        children
      </EmbededButton>
    )}
  </div>
);
const basicColumns = [
  columnHelper.accessor('title', { header: 'Title', id: 'title', cell: TitleCell }),

  columnHelper.accessor('description', { header: 'Description' }),
  columnHelper.accessor('created', {
    header: 'Date added',
    cell: CustomCell,
    meta: { headerClassName: 'something' },
  }),
];

const withActionsColumns = [
  columnHelper.accessor('title', { id: 'title', header: 'Title' }),
  columnHelper.accessor('created', {
    id: 'created',
    header: 'Date added',
    meta: { headerClassName: 'w-1/3' },
  }),
  columnHelper.accessor('description', {
    id: 'description',
    header: 'Description',
    enableSorting: false,
    meta: { headerClassName: 'w-1/3 bg-error-100 text-blue-600' },
  }),
  columnHelper.display({
    id: 'action',
    header: 'Actions',
    cell: ActionsCell,
    meta: { headerClassName: 'text-center' },
  }),
];

export type { SampleSchema };
export {
  StoryComponent,
  CheckboxesTableComponent,
  PaginationTableComponent,
  basicColumns,
  withActionsColumns,
};
