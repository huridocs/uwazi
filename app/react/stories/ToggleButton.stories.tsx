import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ToggleButton, ToggleButtonProps } from 'V2/Components/UI/ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/Buttons/ToggleButton',
  component: ToggleButton,
};

type Story = StoryObj<typeof ToggleButton>;

const ToggleButtonContainer = (args: ToggleButtonProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="tw-content">
      <ToggleButton onToggle={() => setShow(!show)} disabled={args.disabled}>
        <div className="ml-2">{args.children}</div>
      </ToggleButton>
      {show && <p className="pt-3">This text appears and hides using the above toggle</p>}
    </div>
  );
};
const Primary: Story = {
  render: args => <ToggleButtonContainer {...args} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    children: 'My toggle button',
    disabled: false,
  },
};

export { Basic };

export default meta;
