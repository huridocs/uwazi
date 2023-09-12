import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Select } from 'V2/Components/Forms';

const meta: Meta<typeof Select> = {
  title: 'Forms/Select',
  component: Select,
};

type Story = StoryObj<typeof Select>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="md:w-1/2">
        <Select
          id="1"
          label={<p className="mb-2 text-lg">{args.label}</p>}
          options={args.options}
          disabled={args.disabled}
          hideLabel={args.hideLabel}
          hasErrors={args.hasErrors}
        />
      </div>
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: {
    label: 'Please select an option',
    disabled: false,
    hideLabel: false,
    hasErrors: false,
    value: 'Argentina',
    options: [
      { key: '1', value: 'Algeria' },
      { key: '2', value: 'Argentina', selected: true },
      { key: '3', value: 'Bavaria', selected: false },
      { key: '4', value: 'Bolivia', selected: false },
      { key: '5', value: 'Colombia', selected: false },
      { key: '6', value: 'Dinamarca', selected: false },
    ],
  },
};

export { Basic };

export default meta;
