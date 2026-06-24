import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { action } from 'storybook/actions';
import { InputColorPicker } from '#V2/Components/Forms/index.js';

const meta: Meta<typeof InputColorPicker> = {
  title: 'Forms/InputColorPicker',
  component: InputColorPicker,
};
export default meta;

type Story = StoryObj<typeof InputColorPicker>;

const InteractiveWrapper = ({
  initialValue = '#C03B22',
  label,
  disabled = false,
}: {
  initialValue?: string;
  label?: string;
  disabled?: boolean;
}) => {
  const [value, setValue] = useState(initialValue);

  return (
    <InputColorPicker
      name="color"
      value={value}
      label={label}
      disabled={disabled}
      onChange={color => {
        setValue(color);
        action('changed')(color);
      }}
    />
  );
};

const Primary: Story = {
  render: args => (
    <div className="tw-content p-4">
      <InteractiveWrapper
        initialValue={args.value}
        label={typeof args.label === 'string' ? args.label : undefined}
        disabled={args.disabled}
      />
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    value: '#C03B22',
    disabled: false,
  },
};

const WithLabel: Story = {
  ...Primary,
  args: {
    value: '#359990',
    label: 'Background',
    disabled: false,
  },
};

const Disabled: Story = {
  ...Primary,
  args: {
    value: '#3F51B5',
    label: 'Foreground',
    disabled: true,
  },
};

export { Basic, WithLabel, Disabled };
