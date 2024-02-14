import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { EnableButtonCheckbox } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof EnableButtonCheckbox> = {
  title: 'Forms/EnableButtonCheckbox',
  component: EnableButtonCheckbox,
};

type Story = StoryObj<typeof EnableButtonCheckbox>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Provider store={createStore()}>
        <EnableButtonCheckbox
          disabled={args.disabled}
          name={args.name}
          defaultChecked={args.defaultChecked}
          onChange={args.onChange}
        />
      </Provider>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    name: 'option',
    disabled: false,
    defaultChecked: false,
    onChange: () => {},
  },
};

export { Basic };

export default meta;
