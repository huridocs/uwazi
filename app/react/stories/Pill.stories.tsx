import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Pill } from './Pill';

const PillStory = {
  title: 'Components/Pill',
  component: Pill,
};

const Template: ComponentStory<typeof Pill> = args => (
  <div className="tw-content">
    <Pill style={args.style}>{args.children}</Pill>
  </div>
);

const Basic = Template.bind({});

Basic.args = {
  children: <span>Pill Content</span>,
  style: 'default',
};

export { Basic };

export default PillStory as ComponentMeta<typeof Pill>;
