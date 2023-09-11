import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Select, SelectProps } from 'V2/Components/Forms';

const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
};

type Story = StoryObj<typeof Select>;

const ComponentWithSelect = ({ args }: { args: SelectProps }) => {
  const [value, setValue] = useState<string>(args.value || '');

  return (
    <div className="tw-content">
      <div className="md:w-1/2">
        <Select
          id="1"
          label={<p className="mb-2 text-lg">{args.label}</p>}
          options={args.options}
          disabled={args.disabled}
          hideLabel={args.hideLabel}
          hasErrors={args.hasErrors}
          onChange={e => {
            setValue(e.target.value);
          }}
          value={value}
        />
      </div>
    </div>
  );
};

const Primary: Story = {
  render: args => <ComponentWithSelect args={args} />,
};

const Basic = {
  ...Primary,
  args: {
    label: 'Please select an option',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    options: [
      { key: '1', value: 'Algeria' },
      { key: '2', value: 'Argentina' },
      { key: '3', value: 'Bavaria' },
      { key: '4', value: 'Bolivia' },
      { key: '5', value: 'Colombia' },
      { key: '6', value: 'Dinamarca' },
    ],
    value: 'Argentina',
  },
};

export { Basic };

export default meta;
