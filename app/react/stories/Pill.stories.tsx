import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Pill } from 'V2/Components/UI/Pill';

const PillStory = {
  title: 'Components/Pill',
  component: Pill,
};

const Template: ComponentStory<typeof Pill> = args => (
  <div className="tw-content">
    <Pill color={args.color}>{args.children}</Pill>
  </div>
);

const Basic = Template.bind({});

Basic.args = {
  children: <span>Pill Content</span>,
  color: 'gray',
};

export { Basic };

export default PillStory as ComponentMeta<typeof Pill>;
