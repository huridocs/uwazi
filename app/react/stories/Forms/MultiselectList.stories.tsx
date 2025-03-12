import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { MultiselectList, MultiselectListOption } from 'V2/Components/Forms';

const meta: Meta<typeof MultiselectList> = {
  title: 'Forms/MultiselectList',
  component: MultiselectList,
};

type Story = StoryObj<typeof MultiselectList>;

const items = [
  { searchLabel: 'Someone', label: 'Someone', value: 'someone' },
  { searchLabel: 'Another', label: 'Another', value: 'another' },
  { searchLabel: 'Another name', label: 'Another name', value: 'another name' },
  { searchLabel: 'And another', label: 'And another', value: 'and another' },
  { searchLabel: 'Item A', label: 'Item A', value: 'item1' },
  { searchLabel: 'Item B', label: 'Item B', value: 'item2' },
  { searchLabel: 'Item C', label: 'Item C', value: 'item3' },
  { searchLabel: 'Item F', label: 'Item F', value: 'item4' },
  { searchLabel: 'Item G', label: 'Item G', value: 'item5' },
  { searchLabel: 'Item E', label: 'Item E', value: 'item6' },
  { searchLabel: 'Item I', label: 'Item I', value: 'item7' },
  { searchLabel: 'Item J', label: 'Item J', value: 'item8' },
  { searchLabel: 'Item H', label: 'Item H', value: 'item9' },
  {
    searchLabel: 'Item with extra extra extra long name 1',
    label: 'Item with extra extra extra long name 1',
    value: 'lItem1',
  },
  {
    searchLabel: 'Item with ëxtra extra extra long name 2',
    label: 'Item with extra ëxtra extra long name 2',
    value: 'lItem2',
  },

  {
    searchLabel: 'Item with extra extra extra extra extraextraextra long name',
    label: 'Item with extra extra extra extra extraextraextra long name',
    value: 'xlItem',
  },
];

const StoryComponent = ({ args }: any) => {
  const [searchAndFocus, setSearchAndFocus] = useState('');

  return (
    <>
      <div className="tw-content">
        <div className="w-full p-4 m-auto md:w-1/2 min-h-[300px]">
          <MultiselectList
            label={args.label}
            items={args.items}
            onChange={args.onChange}
            hasErrors={args.hasErrors}
            checkboxes={args.checkboxes}
            foldableGroups={args.foldableGroups}
            allowSelelectAll={args.allowSelelectAll}
            startOnSelected={args.startOnSelected}
            value={args.value}
            search={searchAndFocus}
            lookup={args.lookup}
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
  },
};

const WithError: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    onChange: () => {},
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
    value: ['red', 'orange', 'banana'],
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
    onChange: () => {},
    items: [],
  },
};

const remoteLookupFunction = async (search: string): Promise<MultiselectListOption[]> =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(
        items.filter(({ searchLabel }) => searchLabel.toLowerCase().includes(search.toLowerCase()))
      );
    }, 1000);
  });

const RemoteSearch: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    onChange: () => {},
    items: [],
    lookup: remoteLookupFunction,
  },
};

export { Basic, WithError, WithGroups, InitialState, BlankState, RemoteSearch };

export default meta;
