import React from 'react';
import { StoryFn } from '@storybook/react';
import { MultiSelect } from 'V2/Components/Forms';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Provider } from 'react-redux';

const MultiSelectStory = {
  title: 'Forms/MultiSelect',
  component: MultiSelect,
};

const Template: StoryFn<typeof MultiSelect> = args => (
  <Provider store={createStore()}>
    <div className="tw-content">
      <div className="md:w-1/2">
        <h1>Multiselect component</h1>
        <MultiSelect label={args.label} options={args.options} onOptionSelected={() => {}} />
      </div>
    </div>
  </Provider>
);

const Basic = Template.bind({});

Basic.args = {
  label: 'Groups',
  options: [
    { label: 'Someone', value: 'someone' },
    { label: 'Another', value: 'another' },
    { label: 'Another name', value: 'another name' },
    { label: 'And another', value: 'and another' },
  ],
};

export { Basic };

export default { component: MultiSelectStory };
