import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { NewTable, NewTableProps } from 'V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { BasicData, DataWithGroups, basicData, dataWithGroups } from './table/fixtures';
import { GroupCell } from './table/TableComponents';

const meta: Meta<NewTableProps<BasicData>> = {
  title: 'Components/NewTable',
  component: NewTable,
};

type Story = StoryObj<typeof NewTable>;

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
  nestedColumnHelper.accessor('title', { header: 'Title', cell: GroupCell }),
  nestedColumnHelper.accessor('description', { header: 'Description' }),
  nestedColumnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const StoryComponent = ({
  data,
  columns,
  sorting,
  checkboxes,
}: NewTableProps<BasicData | DataWithGroups>) => {
  const [dataState, setDataState] = useState(data);
  const [selected, setSelected] = useState({});

  return (
    <div className="tw-content">
      <div className="w-full">
        <NewTable
          data={data}
          columns={columns}
          onChange={updatedData => setDataState(updatedData)}
          onSelect={sel => setSelected(sel)}
          sorting={sorting}
          checkboxes={checkboxes}
        />
      </div>
      <hr className="my-4" />
      <div data-testid="sorted-items">
        <h2>Sorted items:</h2>
        <div className="flex gap-2">{dataState.map(ds => `${ds.title} `)}</div>
      </div>
      <hr className="my-4" />
      <div data-testid="selected-items">
        <h2>Selected items:</h2>
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
      <hr className="my-4" />
      <div data-testid="sorted-subrows">
        <h2>Sorted subRows:</h2>
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
    </div>
  );
};

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <StoryComponent
        data={args.data}
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
    data: basicData,
    columns: basicColumns,
    sorting: 'dnd',
    checkboxes: false,
  },
};

const Nested = {
  ...Primary,
  args: {
    data: dataWithGroups,
    columns: nestedColumns,
    sorting: 'dnd',
    checkboxes: true,
  },
};

export { Basic, Nested };
export default meta;
