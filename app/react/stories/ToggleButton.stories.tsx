import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ToggleButton } from 'V2/Components/UI/ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/ToggleButton',
  component: ToggleButton,
};

type Story = StoryObj<typeof ToggleButton>;

const ToggleButtonStory: Story = {
  render: args => {
    const [show, setShow] = useState(false);
    return (
      <div className="tw-content">
        <ToggleButton onToggle={() => setShow(!show)} disabled={args.disabled}>
          <div className="ml-2">{args.children}</div>
        </ToggleButton>
        {show && <p className="pt-3">This text appears and hides using the above toggle</p>}
      </div>
    );
  },
};

const Basic: Story = {
  ...ToggleButtonStory,
  args: {
    children: 'My toggle button',
    disabled: false,
  },
};

export { Basic };

export default meta;
