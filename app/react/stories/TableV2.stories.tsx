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
  { tableId: 'A2', title: 'Entity 2', created: 2, description: 'Short text' },
  {
    tableId: 'A1',
    title: 'Entity 1',
    created: 1,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
  },
  {
    tableId: 'A3',
    title: 'Entity 3',
    created: 3,
    description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
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
    <div className="tw-content">
      <NewTable data={args.data} columns={args.columns} />
    </div>
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
