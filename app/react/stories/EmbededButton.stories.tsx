import React from 'react';
import { Provider } from 'react-redux';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { Meta, StoryObj } from '@storybook/react';
import { EmbededButton } from 'app/V2/Components/UI/EmbededButton';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Translate } from 'app/I18N';

const meta: Meta<typeof EmbededButton> = {
  title: 'Components/EmbededButton',
  component: EmbededButton,
};

type Story = StoryObj<typeof EmbededButton>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
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
    </Provider>
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
