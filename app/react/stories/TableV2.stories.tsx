import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import uniqueID from 'shared/uniqueID';
import { Button, NewTable, NewTableProps } from 'V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { BasicData, DataWithGroups, basicData, dataWithGroups } from './table/fixtures';

type StoryProps = {
  tableData: any[];
  checkboxes: boolean;
  sorting: NewTableProps<BasicData | DataWithGroups>['sorting'];
  columns: NewTableProps<BasicData | DataWithGroups>['columns'];
};

const basicColumnHelper = createColumnHelper<BasicData>();
const nestedColumnHelper = createColumnHelper<DataWithGroups>();

const basicColumns = [
  basicColumnHelper.accessor('title', { header: 'Title' }),
  basicColumnHelper.accessor('description', { header: 'Description' }),
  basicColumnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const nestedColumns = [
  nestedColumnHelper.accessor('title', { header: 'Title' }),
  nestedColumnHelper.accessor('description', { header: 'Description' }),
  nestedColumnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const StoryComponent = ({ tableData, columns, sorting, checkboxes }: StoryProps) => {
  const [dataState, setDataState] = useState(tableData);
  const [selected, setSelected] = useState({});

  return (
    <div className="tw-content">
      <div className="w-full">
        <NewTable
          dataState={[dataState, setDataState]}
          selectionState={checkboxes ? [selected, setSelected] : undefined}
          columns={columns}
          sorting={sorting}
          header={
            <div>
              <h2 className="text-lg float-start">Table heading</h2>
            </div>
          }
          footer={<p className="">My table footer</p>}
        />
        <div className="flex gap-2 mt-4">
          <Button
            styling="outline"
            onClick={() => {
              setDataState(dataState.slice(0, dataState.length - 1));
            }}
          >
            Remove last item
          </Button>
          <Button
            styling="outline"
            onClick={() => {
              const id = uniqueID();
              setDataState([
                ...dataState,
                {
                  rowId: id,
                  title: `New item ${id}`,
                  description: `Description for ${id}`,
                  created: Date.now(),
                },
              ]);
            }}
          >
            Add new item
          </Button>
          <Button
            styling="outline"
            onClick={() => {
              setDataState(tableData);
            }}
          >
            Reset data
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
        sorting={args.sorting}
        checkboxes={args.checkboxes}
      />
    </Provider>
  ),
};

const Basic = {
  ...Primary,
  args: {
    tableData: basicData,
    columns: basicColumns,
    sorting: 'dnd',
    checkboxes: true,
  },
};

const Nested = {
  ...Primary,
  args: {
    tableData: dataWithGroups,
    columns: nestedColumns,
    sorting: 'dnd',
    checkboxes: true,
  },
};

export { Basic, Nested };
export default meta;
