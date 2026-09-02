import React, { useState } from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { Checkbox } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/Checkbox',
  component: Checkbox,
});

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

const AllStates = meta.story({
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
});

const Basic = meta.story({
  args: {
    name: 'interactive-checkbox',
    label: 'Uwazi is awesome',
    disabled: false,
    checked: false,
    indeterminate: false,
  },
  render: args => (
    <InteractiveWrapper
      initialChecked={args.checked}
      disabled={args.disabled}
      indeterminate={args.indeterminate}
      label={args.label}
    />
  ),
});

const Checked = storyExtend(Basic, {
  args: {
    label: 'Already checked',
    disabled: false,
    checked: true,
    indeterminate: false,
  },
});

const Indeterminate = meta.story({
  render: () => <Checkbox name="indeterminate-only" label="Partial selection" indeterminate />,
});

const Disabled = storyExtend(Basic, {
  args: {
    label: 'Disabled checkbox',
    disabled: true,
    checked: false,
    indeterminate: false,
  },
});

const DisabledChecked = storyExtend(Basic, {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
    indeterminate: false,
  },
});

const DisabledIndeterminate = meta.story({
  render: () => (
    <Checkbox
      name="disabled-indeterminate-only"
      label="Disabled partial selection"
      disabled
      indeterminate
    />
  ),
});

const CarbonTone = meta.story({
  render: () => <Checkbox name="carbon-tone" label="Carbon tone (filters)" checked tone="carbon" />,
});

export {
  AllStates,
  Basic,
  Checked,
  Indeterminate,
  Disabled,
  DisabledChecked,
  DisabledIndeterminate,
  CarbonTone,
};
