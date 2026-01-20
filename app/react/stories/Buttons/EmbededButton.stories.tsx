import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { Meta, StoryObj } from '@storybook/react';
import { EmbededButton } from '#V2/Components/UI/EmbededButton.jsx';
import { Translate } from '#app/I18N/index.js';

const meta: Meta<typeof EmbededButton> = {
  title: 'Components/Buttons/EmbededButton',
  component: EmbededButton,
};

type Story = StoryObj<typeof EmbededButton>;

const Primary: Story = {
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
};

const Basic: Story = {
  ...Primary,
  args: {
    icon: <CheckCircleIcon />,
    collapsed: false,
    color: 'orange',
    disabled: false,
    children: <Translate>Accept</Translate>,
  },
};
export { Basic };
export default meta;
