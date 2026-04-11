import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import {
  ArrowDownTrayIcon,
  PencilSquareIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '#V2/Components/UI/Button.js';
import type { ButtonVariant } from '#V2/Components/UI/Button.js';

const designVariants: ButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost', 'compact'];
const compatibilityVariants: ButtonVariant[] = ['success'];

const meta: Meta<typeof Button> = {
  title: 'Components/Buttons/Button',
  component: Button,
  args: {
    size: 'medium',
    disabled: false,
    children: 'Button name',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [...designVariants, ...compatibilityVariants],
      labels: {
        primary: 'Primary',
        secondary: 'Secondary',
        danger: 'Danger',
        ghost: 'Ghost',
        compact: 'Compact',
        success: 'Success (compat)',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

const Primary: Story = {
  render: args => (
    <div className="p-4" data-storybook-theme-checks>
      <Button
        variant={args.variant}
        size={args.size}
        disabled={args.disabled}
      >
        {args.children}
      </Button>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    variant: 'primary',
    size: 'medium',
    disabled: false,
    children: 'Button name',
  },
};

const Catalog: Story = {
  render: () => (
    <div className="flex flex-col gap-3 rounded-lg bg-warm p-4" data-storybook-theme-checks>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="medium">
          Primary
        </Button>
        <Button variant="secondary" size="medium">
          Secondary
        </Button>
        <Button variant="danger" size="medium">
          Delete
        </Button>
        <Button variant="ghost" size="small">
          Ghost
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="small" className="inline-flex items-center gap-1.5">
          <PencilSquareIcon className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="secondary" size="small" className="inline-flex items-center gap-1.5">
          <ShareIcon className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button variant="secondary" size="small" className="inline-flex items-center gap-1.5">
          <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          Download
        </Button>
        <Button variant="secondary" size="small" className="inline-flex items-center gap-2">
          <PlusIcon className="h-3.5 w-3.5" />
          Add file
        </Button>
        <Button variant="danger" size="small" className="inline-flex items-center gap-1.5">
          <TrashIcon className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  ),
};

export { Basic, Catalog };
