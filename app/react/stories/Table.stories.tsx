import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Checkbox } from 'flowbite-react';
import { Table } from './Table';

const TableStory = {
  title: 'Components/Table',
  component: Table,
};

const Template: ComponentStory<typeof Table> = args => (
  <div className="tw-content">
    <Table columns={args.columns} data={args.data} />
  </div>
);

const Basic = Template.bind({});

const checkboxCell = () => <Checkbox />;

Basic.args = {
  columns: [
    { id: 'select', Header: '', Cell: checkboxCell },
    { Header: 'Icon', accessor: 'icon', disableSortBy: true },
    { Header: 'Title', accessor: 'title', id: 'title' },
    { Header: 'Date added', accessor: 'created', disableSortBy: true, className: 'italic' },
  ],
  data: [
    { title: 'Entity 1', created: 1676306456, icon: 'check' },
    { title: 'Entity 2', created: 1676425085, icon: 'plus' },
  ],
};

export { Basic };

export default TableStory as ComponentMeta<typeof Table>;
