import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { Card } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/Cards',
  component: Card,
});

const Primary = meta.story({
  args: {
    children: 'Card contents',
    title: 'Card title',
  },
  render: args => (
    <div className="tw-content">
      <Card title={args.title} color={args.color} className={args.className}>
        {args.children}
      </Card>
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    children: 'Card contents',
    title: 'Card title',
  },
});

export { Basic };
