/* eslint-disable react/no-multi-comp */
import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Checkbox } from 'flowbite-react';
import { LocalTable } from './LocalTable';

const LocalTableStory = {
  title: 'Components/LocalTable',
  component: LocalTable,

  argTypes: {
    columns: {
      label: 'columns',
    },
  },
};

const Template: ComponentStory<typeof LocalTable> = args => <LocalTable {...args} />;

const Basic = Template.bind({});

Basic.args = {
  columns: [
    { id: 'select', Header: '', Cell: () => <Checkbox /> },
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
export default LocalTableStory as ComponentMeta<typeof LocalTable>;
