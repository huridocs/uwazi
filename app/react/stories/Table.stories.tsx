import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Checkbox } from 'flowbite-react';
import { Table } from './Table';
import { Button } from './Button';

const TableStory = {
  title: 'Components/Table',
  component: Table,
};

const Template: ComponentStory<typeof Table> = args => (
  <div className="tw-content">
    <Table
      fixedColumns={args.fixedColumns}
      columns={args.columns}
      data={args.data}
      title={args.title}
    />
  </div>
);

const Basic = Template.bind({});
const WithActions = Template.bind({});

const checkboxCell = () => <Checkbox />;

const actionsCell = () => (
  <div>
    <Button>Primary</Button>
    <Button type="secondary">Secondary</Button>
  </div>
);

Basic.args = {
  fixedColumns: true,
  title: 'Table name',
  columns: [
    { key: '1', id: 'select', Header: '', Cell: checkboxCell },
    { key: '2', Header: 'Title', accessor: 'title', id: 'title', isSortable: true },
    { key: '3', Header: 'Description', accessor: 'description' },
    { key: '4', Header: 'Date added', accessor: 'created' },
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
};

WithActions.args = {
  ...Basic.args,
  columns: [
    { key: '1', id: 'select', Header: '', Cell: checkboxCell },
    { key: '2', Header: 'Title', accessor: 'title', id: 'title', isSortable: true },
    { key: '3', Header: 'Description', accessor: 'description' },
    { key: '4', Header: 'Date added', accessor: 'created' },
    { key: '5', id: 'action', Header: 'Actions', Cell: actionsCell },
  ],
};

export { Basic, WithActions };

export default TableStory as ComponentMeta<typeof Table>;
