import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Checkbox } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

type Story = StoryObj<typeof Checkbox>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <Checkbox
        label={args.label}
        defaultChecked={args.defaultChecked}
        checked={args.checked}
        name={args.name}
        onChange={args.onChange}
        className={args.className}
        disabled={args.disabled}
      />
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Uwazi is awesome',
    name: 'awesomeness',
    defaultChecked: false,
    disabled: false,
    checked: false,
    className: '',
    onChange: action('changed'),
  },
};

export { Basic };

export default meta;
