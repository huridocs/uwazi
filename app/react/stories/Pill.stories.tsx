import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { Pill } from '#V2/Components/UI/Pill.js';

const meta = preview.meta({
  title: 'Components/Pill',
  component: Pill,
});

const Primary = meta.story({
  args: {
    children: <span>Pill Content</span>,
    color: 'gray',
    className: '',
  },
  render: args => (
    <div className="tw-content">
      <Pill color={args.color} className={args.className}>
        {args.children}
      </Pill>
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    children: <span>Pill Content</span>,
    color: 'gray',
    className: '',
  },
});

export { Basic };
