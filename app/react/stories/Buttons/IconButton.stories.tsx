import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { EyeIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fn } from 'storybook/test';
import { IconButton } from '#V2/Components/UI/IconButton.js';

const meta: Meta<typeof IconButton> = {
  title: 'Components/Buttons/IconButton',
  component: IconButton,
  args: {
    'aria-label': 'icon action',
    onClick: fn(),
    variant: 'ghost',
    showOnGroupHover: false,
  },
};

type Story = StoryObj<typeof IconButton>;

const Catalog: Story = {
  render: args => (
    <div className="tw-content p-4">
      <div className="group flex items-center gap-2 rounded-md bg-warm p-3">
        <IconButton {...args} variant="ghost" aria-label="preview">
          <EyeIcon className="h-3 w-3" />
        </IconButton>
        <IconButton {...args} variant="danger" aria-label="delete">
          <TrashIcon className="h-3 w-3" />
        </IconButton>
        <IconButton {...args} variant="clear" aria-label="clear">
          <XMarkIcon className="h-3 w-3" />
        </IconButton>
        <IconButton {...args} variant="subtle" aria-label="search tips">
          <MagnifyingGlassIcon className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton {...args} variant="chip" aria-label="remove chip">
          <XMarkIcon className="h-2.5 w-2.5" />
        </IconButton>
        <IconButton {...args} variant="drawer" aria-label="close drawer">
          <XMarkIcon className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </div>
  ),
};

const RevealOnHover: Story = {
  render: args => (
    <div className="tw-content p-4">
      <div className="group flex items-center gap-2 rounded-md bg-warm p-3">
        <span className="text-xs text-ink-secondary">Hover row</span>
        <IconButton {...args} showOnGroupHover aria-label="preview on hover">
          <EyeIcon className="h-3 w-3" />
        </IconButton>
      </div>
    </div>
  ),
};

export default meta;
export { Catalog, RevealOnHover };
