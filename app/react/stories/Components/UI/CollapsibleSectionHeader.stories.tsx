import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { CollapsibleSectionHeader } from '#V2/Components/UI/CollapsibleSectionHeader.js';

const HeaderPreview = ({
  variant,
  title,
  color,
}: {
  variant: 'facet' | 'group' | 'tree';
  title: string;
  color?: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tw-content max-w-md rounded-md border border-border-soft bg-paper">
      <CollapsibleSectionHeader
        variant={variant}
        title={title}
        color={color}
        count={variant === 'facet' ? '2/12' : 12}
        expanded={expanded}
        onToggle={() => setExpanded(current => !current)}
      />
      {expanded && <div className="border-t border-border-soft px-3 py-2 text-xs">Content</div>}
    </div>
  );
};

const meta: Meta<typeof HeaderPreview> = {
  title: 'Components/UI/CollapsibleSectionHeader',
  component: HeaderPreview,
  args: {
    title: 'Section title',
    variant: 'facet',
  },
};

type Story = StoryObj<typeof HeaderPreview>;

const Facet: Story = {
  args: {
    variant: 'facet',
    title: 'Relation type',
  },
};

const Grouped: Story = {
  args: {
    variant: 'group',
    title: 'Person',
    color: '#f59e0b',
  },
};

const Tree: Story = {
  args: {
    variant: 'tree',
    title: 'Source entity',
    color: '#22c55e',
  },
};

export default meta;
export { Facet, Grouped, Tree };
