import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Table } from 'V2/Components/UI/Table';
import { Button } from 'V2/Components/UI/Button';

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
};

type Story = StoryObj<typeof Table>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Table columns={args.columns} data={args.data} title={args.title} />
    </div>
  ),
};

const Checkboxes: Story = {
  render: args => (
    <div className="tw-content">
      <Table columns={args.columns} data={args.data} title={args.title} checkboxes />
      <div className="mt-4">
        <p>Selected rows:</p>
      </div>
    </div>
  ),
};

const actionsCell = () => (
  <div className="flex gap-1">
    <Button>Primary</Button>
    <Button styling="outline">Secondary</Button>
  </div>
);

const Basic = {
  ...Primary,
  args: {
    title: 'Table name',
    columns: [
      { Header: 'Title', accessor: 'title', id: 'title' },
      { Header: 'Description', accessor: 'description', disableSortBy: true },
      { Header: 'Date added', accessor: 'created', disableSortBy: true },
    ],
    data: [
      { title: 'Entity 2', created: 2, description: 'Short text' },
      {
        title: 'Entity 1',
        created: 1,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
      },
      {
        title: 'Entity 3',
        created: 3,
        description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
      },
    ],
  },
};

const WithActions = {
  ...Primary,
  args: {
    ...Basic.args,
    columns: [
      { Header: 'Title', accessor: 'title', id: 'title', className: 'w-1/3' },
      {
        Header: 'Date added',
        accessor: 'created',
        disableSortBy: true,
        className: 'w-1/3',
      },
      {
        Header: 'Description',
        accessor: 'description',
        disableSortBy: true,
        className: 'w-1/3',
      },
      {
        id: 'action',
        Header: 'Actions',
        Cell: actionsCell,
        disableSortBy: true,
        className: 'text-center',
      },
    ],
  },
};

const WithCheckboxes = {
  ...Checkboxes,
  args: {
    ...Basic.args,
  },
};

export { Basic, WithActions, WithCheckboxes };

export default meta;
