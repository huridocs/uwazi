import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { MultiSelect } from 'V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const meta: Meta<typeof MultiSelect> = {
  title: 'Forms/MultiSelect',
  component: MultiSelect,
};

type Story = StoryObj<typeof MultiSelect>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <div className="md:w-1/2">
          <h1>Multiselect component</h1>
          <MultiSelect
            label={args.label}
            options={args.options}
            onChange={args.onChange}
            disabled={args.disabled}
          />
        </div>
      </div>
    </Provider>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Groups',
    options: [
      { label: 'Someone', value: 'someone' },
      { label: 'Another', value: 'another' },
      { label: 'Another name', value: 'another name' },
      { label: 'And another', value: 'and another' },
      { label: 'Item A', value: 'item1' },
      { label: 'Item B', value: 'item2' },
      { label: 'Item C', value: 'item3' },
      { label: 'Item F', value: 'item4' },
      { label: 'Item G', value: 'item5' },
      { label: 'Item E', value: 'item6' },
      { label: 'Item I', value: 'item7' },
      { label: 'Item J', value: 'item8' },
      { label: 'Item H', value: 'item9' },
      { label: 'Item with extra extra extra long name 1', value: 'lItem1' },
      { label: 'Item with extra extra extra long name 2', value: 'lItem2' },
      { label: 'Item with extra extra extra long name 3', value: 'lItem3' },
      { label: 'Item with extra extra extra long name 4', value: 'lItem4' },
      { label: 'Item with extra extra extra long name 5', value: 'lItem5' },
      { label: 'Item with extra extra extra extra extraextraextra long name', value: 'xlItem' },
    ],
    disabled: false,
  },
};

export { Basic };

export default meta;
