import React from 'react';
import preview from '#storybook/preview';
import { MemoryRouter } from 'react-router';
import { Dropdown } from '#V2/Components/UI/Header/Dropdown.js';
import type { DropdownItem } from '#V2/Components/UI/Header/Dropdown.js';

const meta = preview.meta({
  title: 'Components/UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title/trigger text for the dropdown',
    },
    items: {
      control: 'object',
      description: 'Array of dropdown items',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
});

// Sample dropdown items
const sampleItems: DropdownItem[] = [
  { title: 'Home', url: '/', isExternal: false },
  { title: 'About', url: '/about', isExternal: false },
  { title: 'Contact', url: '/contact', isExternal: false },
];

const externalItems: DropdownItem[] = [
  { title: 'Google', url: 'https://google.com', isExternal: true },
  { title: 'GitHub', url: 'https://github.com', isExternal: true },
  { title: 'Documentation', url: 'https://docs.example.com', isExternal: true },
];

const mixedItems: DropdownItem[] = [
  { title: 'Home', url: '/', isExternal: false },
  { title: 'Google', url: 'https://google.com', isExternal: true },
  { title: 'Settings', url: '/settings', isExternal: false },
  { title: 'GitHub', url: 'https://github.com', isExternal: true },
];

const Basic = meta.story({
  args: {
    title: 'Navigation',
    items: sampleItems,
    className: '',
  },
  render: args => (
    <div className="tw-content">
      <Dropdown title={args.title} items={args.items} className={args.className} />
    </div>
  ),
});

const WithExternalLinks = meta.story({
  args: {
    title: 'External Links',
    items: externalItems,
    className: '',
  },
  render: args => (
    <div className="tw-content">
      <Dropdown title={args.title} items={args.items} className={args.className} />
    </div>
  ),
});

const MixedLinks = meta.story({
  args: {
    title: 'Mixed Links',
    items: mixedItems,
    className: '',
  },
  render: args => (
    <div className="tw-content">
      <Dropdown title={args.title} items={args.items} className={args.className} />
    </div>
  ),
});

const LongTitle = meta.story({
  args: {
    title: 'Very Long Dropdown Title That Might Wrap',
    items: sampleItems,
    className: '',
  },
  render: args => (
    <div className="tw-content">
      <Dropdown title={args.title} items={args.items} className={args.className} />
    </div>
  ),
});

const ManyItems = meta.story({
  args: {
    title: 'Many Items',
    items: [
      { title: 'Item 1', url: '/item1', isExternal: false },
      { title: 'Item 2', url: '/item2', isExternal: false },
      { title: 'Item 3', url: '/item3', isExternal: false },
      { title: 'Item 4', url: '/item4', isExternal: false },
      { title: 'Item 5', url: '/item5', isExternal: false },
      { title: 'Item 6', url: '/item6', isExternal: false },
      { title: 'External Link', url: 'https://example.com', isExternal: true },
    ],
    className: '',
  },
  render: args => (
    <div className="tw-content">
      <Dropdown title={args.title} items={args.items} className={args.className} />
    </div>
  ),
});

const WithCustomStyling = meta.story({
  args: {
    title: 'Styled Dropdown',
    items: sampleItems,
    className: 'border-2 border-blue-500 rounded-lg',
  },
  render: args => (
    <div className="tw-content">
      <Dropdown title={args.title} items={args.items} className={args.className} />
    </div>
  ),
});

export { Basic, WithExternalLinks, MixedLinks, LongTitle, ManyItems, WithCustomStyling };
