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
    <Table columns={args.columns} data={args.data} title={args.title} />
  </div>
);

const Basic = Template.bind({});

const checkboxCell = () => <Checkbox />;

Basic.args = {
  columns: [
    { id: 'select', Header: '', Cell: checkboxCell, action: true },
    { Header: 'Icon', accessor: 'icon', disableSortBy: true },
    { Header: 'Title', accessor: 'title', id: 'title' },
    { Header: 'Date added', accessor: 'created', disableSortBy: true },
  ],
  data: [
    { title: 'Entity 2', created: 2, icon: 'plus' },
    { title: 'Entity 1', created: 1, icon: 'check' },
    { title: 'Entity 3', created: 3, icon: 'flag' },
  ],
  title: <h3>Table name</h3>,
};

export { Basic };

export default TableStory as ComponentMeta<typeof Table>;
