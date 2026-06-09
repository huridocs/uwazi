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
  indeterminate = false,
  label = 'Click me',
}: {
  initialChecked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: string | React.ReactNode;
}) => {
  const [checked, setChecked] = useState(initialChecked);

  return (
    <Checkbox
      name="interactive-checkbox"
      label={label}
      checked={checked}
      disabled={disabled}
      indeterminate={indeterminate}
      onChange={() => {
        setChecked(!checked);
        action('changed')(!checked);
      }}
    />
  );
};

const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <Checkbox name="unchecked" label="Unchecked" checked={false} />
      <Checkbox name="checked" label="Checked" checked />
      <Checkbox name="indeterminate" label="Indeterminate" checked={false} indeterminate />
      <Checkbox name="disabled" label="Disabled" disabled checked={false} />
      <Checkbox name="disabled-checked" label="Disabled checked" disabled checked />
      <Checkbox
        name="disabled-indeterminate"
        label="Disabled indeterminate"
        disabled
        indeterminate
      />
    </div>
  ),
};

const Basic: Story = {
  render: args => (
    <InteractiveWrapper
      initialChecked={args.checked}
      disabled={args.disabled}
      indeterminate={args.indeterminate}
      label={args.label}
    />
  ),
  args: {
    label: 'Uwazi is awesome',
    disabled: false,
    checked: false,
    indeterminate: false,
  },
};

const Checked: Story = {
  ...Basic,
  args: {
    label: 'Already checked',
    disabled: false,
    checked: true,
    indeterminate: false,
  },
};

const Indeterminate: Story = {
  render: () => <Checkbox name="indeterminate-only" label="Partial selection" indeterminate />,
};

const Disabled: Story = {
  ...Basic,
  args: {
    label: 'Disabled checkbox',
    disabled: true,
    checked: false,
    indeterminate: false,
  },
};

const DisabledChecked: Story = {
  ...Basic,
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
    indeterminate: false,
  },
};

const DisabledIndeterminate: Story = {
  render: () => (
    <Checkbox name="disabled-indeterminate-only" label="Disabled partial selection" disabled indeterminate />
  ),
};

export {
  AllStates,
  Basic,
  Checked,
  Indeterminate,
  Disabled,
  DisabledChecked,
  DisabledIndeterminate,
};
