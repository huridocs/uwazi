import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { createColumnHelper } from '@tanstack/react-table';
import { Provider } from 'react-redux';
import { NewTable, NewTableProps } from 'V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

type BasicData = {
  rowId: string;
  title: string;
  created: number;
  description: string;
};

const meta: Meta<NewTableProps<BasicData>> = {
  title: 'Components/NewTable',
  component: NewTable,
};

type Story = StoryObj<typeof NewTable>;

const basicData: BasicData[] = [
  { rowId: 'A2', title: 'Entity 2', created: 2, description: 'Short text' },
  {
    rowId: 'A1',
    title: 'Entity 1',
    created: 1,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
  },
  {
    rowId: 'A4',
    title: 'Entity 4',
    created: 4,
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  },
  {
    rowId: 'A3',
    title: 'Entity 3',
    created: 3,
    description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
  },
  {
    rowId: 'A5',
    title: 'Entity 5',
    created: 5,
    description:
      'Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo.',
  },
];

const columnHelper = createColumnHelper<BasicData>();

const basicColumns = [
  columnHelper.accessor('title', { header: 'Title' }),
  columnHelper.accessor('description', { header: 'Description' }),
  columnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const StoryComponent = ({ data, columns, sorting, checkboxes }: NewTableProps<BasicData>) => {
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
        <div className="flex gap-2">
          {dataState.map(ds => (
            <span key={ds.rowId}>{ds.title}</span>
          ))}
        </div>
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

export { Basic };
export default meta;
