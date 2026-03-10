import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from 'app/V2/Components/UI/Header/Dropdown';
import type { DropdownItem } from 'app/V2/Components/UI/Header/Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
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
};

type Story = StoryObj<typeof Dropdown>;

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

const Basic: Story = {
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
};

const WithExternalLinks: Story = {
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
};

const MixedLinks: Story = {
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
};

const LongTitle: Story = {
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
};

const ManyItems: Story = {
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
};

const WithCustomStyling: Story = {
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
};

export { Basic, WithExternalLinks, MixedLinks, LongTitle, ManyItems, WithCustomStyling };
export default meta;
