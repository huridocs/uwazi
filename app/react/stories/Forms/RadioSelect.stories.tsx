import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { RadioSelect } from 'app/V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof RadioSelect> = {
  title: 'Forms/RadioSelect',
  component: RadioSelect,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

type Story = StoryObj<typeof RadioSelect>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <RadioSelect
        legend={args.legend}
        options={args.options}
        name={args.name}
        onChange={args.onChange}
        orientation={args.orientation}
      />
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    legend: 'Choose your favorite country',
    name: 'country',
    options: [
      {
        id: 'united-state',
        label: 'USA',
        value: 'united-state',
      },
      { label: 'Germany', value: 'germany' },
      {
        id: 'spain',
        label: 'Spain',
        value: 'spain',
        defaultChecked: true,
      },
      {
        id: 'uk',
        label: 'United Kingdom',
        value: 'uk',
        disabled: true,
      },
      { id: 'china', label: 'China', value: 'china' },
    ],
    onChange: action('changed'),
  },
};

const Horizontal: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    orientation: 'horizontal',
  },
};

export { Basic, Horizontal };

export default meta;
