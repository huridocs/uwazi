import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { NewTable } from 'V2/Components/UI';
import { createColumnHelper } from '@tanstack/react-table';

const meta: Meta<typeof NewTable> = {
  title: 'Components/NewTable',
  component: NewTable,
};

type Story = StoryObj<typeof NewTable>;

const basicData = [
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

const columnHelper = createColumnHelper<typeof basicData>();

const basicColumns = [
  columnHelper.accessor('title', { header: 'Title' }),
  columnHelper.accessor('description', { header: 'Description' }),
  columnHelper.accessor('created', {
    header: 'Date added',
  }),
];

const Primary: Story = {
  render: args => (
    <React.StrictMode>
      <div className="tw-content">
        <div className="w-full">
          <NewTable data={args.data} columns={args.columns} />
        </div>
      </div>
    </React.StrictMode>
  ),
};

const Basic = {
  ...Primary,
  args: {
    data: basicData,
    columns: basicColumns,
  },
};

export { Basic };
export default meta;
