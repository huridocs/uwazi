import React, { useState } from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { defaultSearch, MultiselectList } from '#V2/Components/Forms/index.js';
import { items, remoteLookupFunction } from './MultiselectListSotoryFixtures.js';

const meta = preview.meta({
  title: 'Forms/MultiselectList',
  component: MultiselectList,
});

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

const Primary = meta.story({
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
  render: args => <StoryComponent args={args} />,
});

const Basic = storyExtend(Primary, {
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
});

const WithError = storyExtend(Primary, {
  args: {
    ...Basic.composed.args,
    hasErrors: true,
  },
});

const WithGroups = storyExtend(Primary, {
  args: {
    ...Basic.composed.args,
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
});

const InitialState = storyExtend(Primary, {
  args: {
    ...Basic.composed.args,
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
});

const BlankState = storyExtend(Primary, {
  args: {
    ...Basic.composed.args,
    items: [],
  },
});

const RemoteSearch = storyExtend(Primary, {
  args: {
    ...Basic.composed.args,
    items: [],
    onSearch: remoteLookupFunction,
  },
});

export { Basic, WithError, WithGroups, InitialState, BlankState, RemoteSearch };
