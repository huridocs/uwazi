/* eslint-disable react/no-multi-comp */
import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Checkbox } from 'flowbite-react';
import { LocalTable } from './LocalTable';

const LocalTableStory = {
  title: 'Example/LocalTable',
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
    { header: '', cell: () => <Checkbox /> },
    { header: 'Icon', accesor: 'icon' },
    { header: 'Title', accesor: 'title' },
    { header: 'Date added', accesor: 'created' },
  ],
  data: [{ title: 'Entity 1', created: 1676306456, icon: 'check' }],
};

export { Basic };
export default LocalTableStory as ComponentMeta<typeof LocalTable>;
