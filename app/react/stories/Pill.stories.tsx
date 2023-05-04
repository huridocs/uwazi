import React from 'react';
import { StoryFn } from '@storybook/react';
import { Pill } from 'V2/Components/UI/Pill';

const PillStory = {
  title: 'Components/Pill',
  component: Pill,
};

const Template: StoryFn<typeof Pill> = args => (
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

export default { component: PillStory };
