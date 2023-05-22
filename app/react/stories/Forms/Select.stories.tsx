import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Select } from 'V2/Components/Forms';

const InputFieldStory = {
  title: 'Forms/Select',
  component: Select,
};

const Template: ComponentStory<typeof Select> = args => (
  <div className="tw-content">
    <div className="md:w-1/2">
      <Select
        id="1"
        label={<p className="text-lg mb-2">{args.label}</p>}
        options={args.options}
        disabled={args.disabled}
        hideLabel={args.hideLabel}
        hasErrors={args.hasErrors}
      />
    </div>
  </div>
);

const Basic = Template.bind({});

Basic.args = {
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
};

export { Basic };

export default InputFieldStory as ComponentMeta<typeof Select>;
