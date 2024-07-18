import React, { useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { createColumnHelper, SortingState } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { Button, NewTable, NewTableProps } from 'V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { BasicData, DataWithGroups, basicData, dataWithGroups } from './table/fixtures';

type StoryProps = {
  columns: NewTableProps<BasicData | DataWithGroups>['columns'];
  tableData: any[];
  enableDnd: boolean;
  enableSelections: boolean;
  defaultSorting: SortingState;
  manualSorting: boolean;
};

const basicColumnHelper = createColumnHelper<BasicData>();
const nestedColumnHelper = createColumnHelper<DataWithGroups>();

const basicColumns = [
  basicColumnHelper.accessor('title', { header: 'Title' }),
  basicColumnHelper.accessor('description', { header: 'Description', enableSorting: false }),
  basicColumnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const nestedColumns = [
  nestedColumnHelper.accessor('title', { header: 'Title' }),
  nestedColumnHelper.accessor('description', { header: 'Description', enableSorting: false }),
  nestedColumnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const StoryComponent = ({
  columns,
  tableData,
  enableDnd,
  enableSelections,
  defaultSorting,
  manualSorting,
}: StoryProps) => {
  const [dataState, setDataState] = useState(tableData);
  const [selected, setSelected] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const currentDataState = useRef(tableData);
  const currentSelections = useRef({});
  const [itemCounter, setItemCounter] = useState(1);

  return (
    <div className="tw-content">
      <div className="w-full">
        <NewTable
          data={dataState}
          columns={columns}
          defaultSorting={defaultSorting}
          onChange={({ rows, selectedRows, sortingState }) => {
            currentDataState.current = rows;
            currentSelections.current = selectedRows;
            setSorting(sortingState);
          }}
          enableDnd={enableDnd}
          enableSelections={enableSelections}
          manualSorting={manualSorting}
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
  title: 'Components/NewTable',
  component: StoryComponent,
};

type Story = StoryObj<StoryProps>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <StoryComponent
        tableData={args.tableData}
        columns={args.columns}
        enableDnd={args.enableDnd}
        enableSelections={args.enableSelections}
        defaultSorting={args.defaultSorting}
        manualSorting={args.manualSorting}
      />
    </Provider>
  ),
};

const Basic = {
  ...Primary,
  args: {
    tableData: basicData,
    columns: basicColumns,
    enableDnd: true,
    enableSelections: true,
    defaultSorting: undefined,
    manualSorting: undefined,
  },
};

const Nested = {
  ...Primary,
  args: {
    tableData: dataWithGroups,
    columns: nestedColumns,
    enableDnd: true,
    enableSelections: true,
    defaultSorting: undefined,
    manualSorting: undefined,
  },
};

export { Basic, Nested };
export default meta;
