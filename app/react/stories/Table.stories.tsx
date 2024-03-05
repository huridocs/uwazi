import React from 'react';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { Table } from 'V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import {
  StoryComponent,
  type SampleSchema,
  CheckboxesTableComponent,
  PaginationTableComponent,
  basicColumns,
  withActionsColumns,
} from './table/TableComponents';
import { BasicData, LongData } from './table/fixtures';

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

const Pagination: Story = {
  render: args => (
    <Provider store={createStore()}>
      <PaginationTableComponent {...args} />
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    title: 'Table name',
    footer: <span className="text-sm italic text-gray-500">* Table footer</span>,
    columns: basicColumns,
    setSorting: undefined,
    data: BasicData,
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

const WithPagination: Story = {
  ...Pagination,
  args: {
    ...Basic.args,
    data: LongData,
  },
};

export { Basic, WithActions, WithCheckboxes, WithInitialState, WithDnD, NestedDnD, WithPagination };

export default meta;
