import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { EmbededButton } from '#V2/Components/UI/EmbededButton.js';
import { Translate } from '#app/I18N/index.js';

const meta = preview.meta({
  title: 'Components/Buttons/EmbededButton',
  component: EmbededButton,
});

const Primary = meta.story({
  args: {
    icon: <CheckCircleIcon />,
    collapsed: false,
    color: 'orange',
    disabled: false,
    children: <Translate>Accept</Translate>,
  },
  render: args => (
    <div className="tw-content">
      <EmbededButton
        collapsed={args.collapsed}
        icon={args.icon}
        disabled={args.disabled}
        color={args.color}
      >
        {args.children}
      </EmbededButton>
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    icon: <CheckCircleIcon />,
    collapsed: false,
    color: 'orange',
    disabled: false,
    children: <Translate>Accept</Translate>,
  },
});
export { Basic };
