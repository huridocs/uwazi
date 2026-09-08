import React, { useState } from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { action } from 'storybook/actions';
import { InputColorPicker } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/InputColorPicker',
  component: InputColorPicker,
});

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

const Primary = meta.story({
  args: {
    value: '#C03B22',
    disabled: false,
  },
  render: args => (
    <div className="tw-content p-4">
      <InteractiveWrapper
        initialValue={args.value}
        label={typeof args.label === 'string' ? args.label : undefined}
        disabled={args.disabled}
      />
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    value: '#C03B22',
    disabled: false,
  },
});

const WithLabel = storyExtend(Primary, {
  args: {
    value: '#359990',
    label: 'Background',
    disabled: false,
  },
});

const Disabled = storyExtend(Primary, {
  args: {
    value: '#3F51B5',
    label: 'Foreground',
    disabled: true,
  },
});

export { Basic, WithLabel, Disabled };
