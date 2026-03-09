import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';
import { Checkbox } from '#V2/Components/Forms/index.js';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

const InteractiveWrapper = ({
  initialChecked = false,
  disabled = false,
  label = 'Click me',
}: {
  initialChecked?: boolean;
  disabled?: boolean;
  label?: string | React.ReactNode;
}) => {
  const [checked, setChecked] = useState(initialChecked);

  return (
    <Checkbox
      name="interactive-checkbox"
      label={label}
      checked={checked}
      disabled={disabled}
      onChange={() => {
        setChecked(!checked);
        action('changed')(!checked);
      }}
    />
  );
};

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <InteractiveWrapper
        initialChecked={args.checked}
        disabled={args.disabled}
        label={args.label}
      />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Uwazi is awesome',
    disabled: false,
    checked: false,
  },
};

const Checked: Story = {
  ...Primary,
  args: {
    label: 'Already checked',
    disabled: false,
    checked: true,
  },
};

const Disabled: Story = {
  ...Primary,
  args: {
    label: 'Disabled checkbox',
    disabled: true,
    checked: false,
  },
};

const DisabledChecked: Story = {
  ...Primary,
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
  },
};

export { Basic, Checked, Disabled, DisabledChecked };
