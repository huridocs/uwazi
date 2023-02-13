import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { LocalTable } from './LocalTable';

const LocalTableStory = {
  title: 'Example/LocalTable',
  component: LocalTable,

  argTypes: {
    header: {
      label: 'header',
    },
  },
};

const Template: ComponentStory<typeof LocalTable> = args => <LocalTable {...args} />;

const Basic = Template.bind({});

Basic.args = {
  header: ['Selector', 'Icon', 'Title', 'Date added'],
  rows: [['', 'check', 'Entity 1', 1676306456]],
};

export { Basic };
export default LocalTableStory as ComponentMeta<typeof LocalTable>;
