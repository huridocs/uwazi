import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { defaultSearch, MultiselectList } from 'V2/Components/Forms';
import { items, remoteLookupFunction } from './MultiselectListSotoryFixtures';

const meta: Meta<typeof MultiselectList> = {
  title: 'Forms/MultiselectList',
  component: MultiselectList,
};

type Story = StoryObj<typeof MultiselectList>;

const StoryComponent = ({ args }: any) => {
  const [searchAndFocus, setSearchAndFocus] = useState('');
  const [selectItems, setSelectItems] = useState(args.items);

  return (
    <>
      <div className="tw-content">
        <div className="w-full p-4 h-96 overflow-y-auto">
          <MultiselectList
            label={args.label}
            items={selectItems}
            hasErrors={args.hasErrors}
            checkboxes={args.checkboxes}
            foldableGroups={args.foldableGroups}
            allowSelelectAll={args.allowSelelectAll}
            startOnSelected={args.startOnSelected}
            selectedValues={args.selectedValues}
            search={searchAndFocus}
            onSearch={async term => {
              const newItems = await args.onSearch(term, args.items);
              setSelectItems(newItems);
            }}
          />
        </div>
      </div>
      <button type="button" className="tw-hidden" onClick={() => setSearchAndFocus('another')}>
        Search & Focus
      </button>
      <button type="button" className="tw-hidden" onClick={() => setSearchAndFocus('')}>
        Clear
      </button>
    </>
  );
};

const Primary: Story = {
  render: args => <StoryComponent args={args} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    label: 'Search for something',
    checkboxes: true,
    foldableGroups: true,
    hasErrors: false,
    allowSelelectAll: false,
    startOnSelected: false,
    items,
    onSearch: defaultSearch,
  },
};

const WithError: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    hasErrors: true,
  },
};

const WithGroups: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    items: [
      {
        searchLabel: 'Colors',
        label: 'Colors',
        value: 'colors',
        items: [
          { searchLabel: 'Red', label: 'Red', value: 'red' },
          { searchLabel: 'Blue', label: 'Blue', value: 'blue' },
          { searchLabel: 'Green', label: 'Green', value: 'green' },
        ],
      },
      {
        searchLabel: 'Animals',
        label: 'Animals',
        value: 'animals',
        items: [
          { searchLabel: 'Dog', label: 'Dog', value: 'dog' },
          { searchLabel: 'Cat', label: 'Cat', value: 'cat' },
          { searchLabel: 'Bird', label: 'Bird', value: 'bird' },
        ],
      },
      {
        searchLabel: 'Fruits',
        label: 'Fruits',
        value: 'fruits',
        items: [
          { searchLabel: 'Apple', label: 'Apple', value: 'apple' },
          { searchLabel: 'Banana', label: 'Banana', value: 'banana' },
          { searchLabel: 'Orange', label: 'Orange', value: 'orange' },
        ],
      },
    ],
  },
};

const InitialState: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    selectedValues: ['red', 'orange', 'banana'],
    startOnSelected: true,
    items: [
      {
        searchLabel: 'Colors',
        label: 'Colors',
        value: 'colors',
        items: [
          { searchLabel: 'Red', label: 'Red', value: 'red' },
          { searchLabel: 'Blue', label: 'Blue', value: 'blue' },
          { searchLabel: 'Green', label: 'Green', value: 'green' },
        ],
      },
      {
        searchLabel: 'Animals',
        label: 'Animals',
        value: 'animals',
        items: [
          { searchLabel: 'Dog', label: 'Dog', value: 'dog' },
          { searchLabel: 'Cat', label: 'Cat', value: 'cat' },
          { searchLabel: 'Bird', label: 'Bird', value: 'bird' },
        ],
      },
      {
        searchLabel: 'Fruits',
        label: 'Fruits',
        value: 'fruits',
        items: [
          { searchLabel: 'Apple', label: 'Apple', value: 'apple' },
          { searchLabel: 'Banana', label: 'Banana', value: 'banana' },
          { searchLabel: 'Orange', label: 'Orange', value: 'orange' },
        ],
      },
    ],
  },
};

const BlankState: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    items: [],
  },
};

const RemoteSearch: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    items: [],
    onSearch: remoteLookupFunction,
  },
};

export { Basic, WithError, WithGroups, InitialState, BlankState, RemoteSearch };

export default meta;
