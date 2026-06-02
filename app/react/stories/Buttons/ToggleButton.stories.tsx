import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { ToggleButton, ToggleButtonProps } from '#V2/Components/UI/ToggleButton.js';

const meta: Meta<typeof ToggleButton> = {
  title: 'Components/Buttons/ToggleButton',
  component: ToggleButton,
};
export default meta;

type Story = StoryObj<typeof ToggleButton>;

const ToggleButtonContainer = (args: ToggleButtonProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="tw-content">
      <ToggleButton onToggle={() => setShow(!show)} disabled={args.disabled} size={args.size}>
        <div>{args.children}</div>
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
    size: 'regular',
  },
};

export { Basic };
