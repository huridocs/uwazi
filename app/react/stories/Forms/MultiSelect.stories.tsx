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

const MultiSelectStory: Story = {
  render: args => (
    <Provider store={createStore()}>
      <div className="tw-content">
        <div className="md:w-1/2">
          <MultiSelect label={args.label} options={args.options} onOptionSelected={() => {}} />
        </div>
      </div>
    </Provider>
  ),
};

const Basic: Story = {
  ...MultiSelectStory,
  args: {
    label: 'Groups',
    options: [
      { label: 'Someone', value: 'someone' },
      { label: 'Another', value: 'another' },
      { label: 'Another name', value: 'another name' },
      { label: 'And another', value: 'and another' },
    ],
  },
};

export { Basic };

export default meta;
