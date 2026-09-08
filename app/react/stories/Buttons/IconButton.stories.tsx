// oxlint-disable react/jsx-props-no-spreading
import React from 'react';
import preview from '#storybook/preview';
import { EyeIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fn } from 'storybook/test';
import { IconButton } from '#V2/Components/UI/IconButton.js';

const meta = preview.meta({
  title: 'Components/Buttons/IconButton',
  component: IconButton,
  args: {
    'aria-label': 'icon action',
    onClick: fn(),
    variant: 'ghost',
    showOnGroupHover: false,
  },
});

const Catalog = meta.story({
  args: {
    'aria-label': 'icon action',
    onClick: fn(),
    variant: 'ghost',
    showOnGroupHover: false,
    children: <EyeIcon className="h-3 w-3" />,
  },
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
});

const RevealOnHover = meta.story({
  args: {
    'aria-label': 'preview on hover',
    onClick: fn(),
    variant: 'ghost',
    showOnGroupHover: true,
    children: <EyeIcon className="h-3 w-3" />,
  },
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
});
export { Catalog, RevealOnHover };
