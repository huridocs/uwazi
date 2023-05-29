import React, { useContext, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Table, TableProps } from 'V2/Components/UI/Table';
import { Button, SelectionContext } from 'V2/Components/UI';
import { TableSelector } from 'app/V2/Components/UI/TableWithCheckbox';

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

const Report = () => {
  const [selected] = useContext(SelectionContext);
  return (
    <>
      <p className="mb-4">Selected rows: {selected.length}</p>
      <pre>{selected.map(select => JSON.stringify(select.original, null, 2))}</pre>
    </>
  );
};

const TableWithCheckBoxes = ({ columns, data, title }: TableProps) => (
  <div className="tw-content">
    <h1>Table one</h1>
    <TableSelector>
      <Table columns={columns} data={data} title={title} checkboxes />
      <div className="mt-4">
        <Report />
      </div>
    </TableSelector>

    <hr />

    <h2>Table two</h2>
    <TableSelector>
      <Table columns={columns} data={data} title={title} checkboxes />
      <div className="mt-4">
        <Report />
      </div>
    </TableSelector>
  </div>
);

const Checkboxes: Story = {
  render: args => (
    <TableWithCheckBoxes columns={args.columns} data={args.data} title={args.title} />
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
