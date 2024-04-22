import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Table } from 'V2/Components/UI';
import {
  StoryComponent,
  type SampleSchema,
  CheckboxesTableComponent,
  basicColumns,
  withActionsColumns,
} from './table/TableComponents';

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
};

type Story = StoryObj<typeof Table<SampleSchema>> & { args?: { showUpdates?: boolean } };

const Primary: Story = {
  render: args => <StoryComponent {...args} />,
};

const Checkboxes: Story = {
  render: CheckboxesTableComponent,
};

const Basic: Story = {
  ...Primary,
  args: {
    title: 'Table name',
    footer: <span className="text-sm italic text-gray-500">* Table footer</span>,
    columns: basicColumns,
    data: [
      { title: 'Entity 2', created: 2, description: 'Short text' },
      {
        title: 'Entity 1',
        created: 1,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
        children: [
          {
            title: 'Entity a',
            created: 4,
            description: 'Donec feugiat at libero at rutrum.',
          },
          {
            title: 'Entity b',
            created: 5,
            description: 'Phasellus vel efficitur quam.',
          },
        ],
      },
      {
        title: 'Entity 3',
        created: 3,
        description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
      },
    ],
    setSorting: undefined,
  },
};

const WithInitialState: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    initialState: { sorting: [{ id: 'description', desc: true }] },
  },
};

const WithActions: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    columns: withActionsColumns,
  },
};

const WithCheckboxes = {
  ...Checkboxes,
  args: {
    ...Basic.args,
  },
};

const WithDnD: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    draggableRows: true,
    initialState: { sorting: [{ id: 'description', desc: true }] },
    showUpdates: true,
  },
};

const NestedDnD: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    subRowsKey: 'children',
    showUpdates: true,
    draggableRows: true,
  },
};

export { Basic, WithActions, WithCheckboxes, WithInitialState, WithDnD, NestedDnD };

export default meta;
