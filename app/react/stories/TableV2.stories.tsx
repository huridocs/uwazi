/* eslint-disable max-lines */
import React, { useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Cell, createColumnHelper, SortingState } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { Button, Table } from 'V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { BasicData, DataWithGroups, basicData, dataWithGroups } from './table/fixtures';

type StoryProps = {
  columnType: string;
  tableData: any[];
  dnd?: { enable?: boolean; disableEditingGroups?: boolean };
  enableSelections?: boolean;
  defaultSorting?: SortingState;
  sortingFn?: () => void;
  actionFn?: () => void;
};

const CustomDateCell = ({ cell }: { cell: Cell<BasicData, number> }) => (
  <div className="text-white bg-orange-500">{cell.renderValue()}</div>
);

const ActionHeader = () => <span className="sr-only">Actions</span>;

const ActionCell = ({ cell }: { cell: Cell<BasicData, any> }) => {
  const actionFn = cell.getContext().column.columnDef.meta?.action
    ? cell.getContext().column.columnDef.meta?.action!
    : () => {};

  return (
    <Button type="button" styling="light" onClick={() => actionFn(cell.row.id)}>
      Action
    </Button>
  );
};

const basicColumnHelper = createColumnHelper<BasicData>();
const nestedColumnHelper = createColumnHelper<DataWithGroups>();

const basicColumns = [
  basicColumnHelper.accessor('title', { header: 'Title' }),
  basicColumnHelper.accessor('description', { header: 'Description', enableSorting: false }),
  nestedColumnHelper.accessor('created', { header: 'Date added' }),
];

const nestedColumns = [
  nestedColumnHelper.accessor('title', { header: 'Title' }),
  nestedColumnHelper.accessor('description', { header: 'Description', enableSorting: false }),
  nestedColumnHelper.accessor('created', { header: 'Date added' }),
];

const getCustomColums = (actionFn?: () => any) => [
  basicColumnHelper.accessor('title', {
    header: 'Title',
    meta: { contentClassName: 'bg-gray-100 text-red-700' },
  }),
  basicColumnHelper.accessor('description', {
    enableSorting: false,
    header: 'Description',
    size: 200,
    meta: { headerClassName: 'bg-blue-700 text-white' },
  }),
  basicColumnHelper.accessor('created', { header: 'Date added', cell: CustomDateCell }),
  basicColumnHelper.display({
    id: 'action',
    header: ActionHeader,
    cell: ActionCell,
    minSize: 25,
    size: 0,
    meta: { action: actionFn || action('accepted') },
  }),
];

const getColumns = (type: string, actionFn?: () => any) => {
  switch (type) {
    case 'nested':
      return nestedColumns;

    case 'custom':
      return getCustomColums(actionFn);

    default:
      return basicColumns;
  }
};

const StoryComponent = ({
  columnType,
  tableData,
  dnd,
  enableSelections,
  defaultSorting,
  sortingFn,
  actionFn,
}: StoryProps) => {
  const [dataState, setDataState] = useState(tableData);
  const [selected, setSelected] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const currentDataState = useRef(tableData);
  const currentSelections = useRef({});
  const [itemCounter, setItemCounter] = useState(1);

  const columns = getColumns(columnType, actionFn);

  return (
    <div className="tw-content">
      <div className="w-full">
        <Table
          data={dataState}
          columns={columns}
          defaultSorting={defaultSorting}
          onChange={({ rows, selectedRows, sortingState }) => {
            currentDataState.current = rows;
            currentSelections.current = selectedRows;
            setSorting(sortingState);
          }}
          sortingFn={sortingFn}
          dnd={dnd}
          enableSelections={enableSelections}
          header={
            <div className="flex flex-col gap-1 items-start">
              <h2 className="text-lg">Table heading</h2>
              <p>{sorting.length ? `Sorted by ${sorting[0].id}` : 'No sorting'}</p>
            </div>
          }
          footer={<p className="">My table footer</p>}
        />
        <div className="flex gap-2 mt-4">
          <Button
            styling="outline"
            onClick={() => {
              setDataState([
                ...currentDataState.current,
                {
                  rowId: `new-${itemCounter}`,
                  title: `New item ${itemCounter}`,
                  description: `Description for ${itemCounter}`,
                  created: Date.now(),
                },
              ]);
              setItemCounter(itemCounter + 1);
            }}
          >
            Add new item
          </Button>
          <Button
            styling="outline"
            onClick={() => {
              setDataState(currentDataState.current.slice(0, dataState.length - 1));
            }}
          >
            Remove last item
          </Button>
          <Button
            styling="outline"
            onClick={() => {
              setDataState(tableData);
            }}
          >
            Reset data
          </Button>
          <Button
            styling="solid"
            onClick={() => {
              setDataState(currentDataState.current);
              setSelected(currentSelections.current);
            }}
          >
            Save changes
          </Button>
        </div>
      </div>
      <hr className="my-4" />
      <div data-testid="sorted-items">
        <h2>Row state:</h2>
        <div className="flex gap-2">{dataState.map(ds => `${ds.title} `)}</div>
      </div>
      <hr className="my-4" />
      <div data-testid="sorted-subrows">
        <h2>Subrow state:</h2>
        <div className="flex gap-2">
          {dataState.map((ds: DataWithGroups) =>
            ds.subRows?.map(subRow => (
              <span key={subRow.rowId}>
                |{ds.title} - {subRow.title}|
              </span>
            ))
          )}
        </div>
      </div>
      <hr className="my-4" />
      <div data-testid="selected-items">
        <h2>Selected rows:</h2>
        <div className="flex gap-2">
          {dataState
            .filter(ds => ds.rowId in selected)
            .map(ds => (
              <span key={ds.rowId}>{ds.title}</span>
            ))}
        </div>
      </div>
      <hr className="my-4" />
      <div data-testid="selected-subrows">
        <h2>Selected subRows:</h2>
        <div className="flex gap-2">
          {dataState.map((ds: DataWithGroups) =>
            ds.subRows
              ?.filter(subRow => subRow.rowId in selected)
              .map(subRow => <span key={subRow.rowId}>{subRow.title}</span>)
          )}
        </div>
      </div>
    </div>
  );
};

const meta: Meta<StoryProps> = {
  title: 'Components/TableV2',
  component: StoryComponent,
};

type Story = StoryObj<StoryProps>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <StoryComponent
        tableData={args.tableData}
        columnType={args.columnType}
        dnd={{ enable: args.dnd?.enable, disableEditingGroups: args.dnd?.disableEditingGroups }}
        enableSelections={args.enableSelections}
        defaultSorting={args.defaultSorting}
        sortingFn={args.sortingFn}
        actionFn={args.actionFn}
      />
    </Provider>
  ),
};

const Basic = {
  ...Primary,
  args: {
    dnd: { enable: true, disableEditingGroups: false },
    enableSelections: true,
    defaultSorting: undefined,
    tableData: basicData,
    columnType: 'basic',
    sortingFn: undefined,
    actionFn: undefined,
  },
};

const Nested = {
  ...Primary,
  args: {
    ...Basic.args,
    tableData: dataWithGroups,
    columnType: 'nested',
  },
};

const Custom = {
  ...Primary,
  args: {
    ...Basic.args,
    enableSelections: false,
    dnd: undefined,
    columnType: 'custom',
  },
};

export { Basic, Nested, Custom };
export default meta;
