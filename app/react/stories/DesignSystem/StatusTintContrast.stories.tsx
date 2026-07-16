import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { StatusBadge } from '#V2/Components/UI/index.js';

const STATUSES = [
  { label: 'Completed', tone: 'success' as const },
  { label: 'Warnings', tone: 'warning' as const },
  { label: 'Processing', tone: 'carbon' as const },
  { label: 'Failed', tone: 'seal' as const },
  { label: 'Pending', tone: 'muted' as const },
];

const ComparisonSheet = () => (
  <div className="tw-content max-w-xl space-y-5 rounded-lg border border-border bg-paper p-5">
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-4">
        <span className="w-24 shrink-0" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
          Locked semantic tint
        </span>
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
          Proposed (65% + ink)
        </span>
      </div>
      {STATUSES.filter(s => s.tone !== 'muted').map(status => (
        <div key={status.label} className="flex items-center gap-4">
          <span className="w-24 shrink-0 text-xs text-ink-tertiary">{status.label}</span>
          <span className="flex-1">
            <StatusBadge label={status.label} tone={status.tone} />
          </span>
          <span className="flex-1 text-xs text-ink-tertiary">Uses color-mix for AA contrast</span>
        </div>
      ))}
    </div>
  </div>
);

const meta: Meta<typeof ComparisonSheet> = {
  title: 'Design System/Proposals/Status tint contrast',
  component: ComparisonSheet,
  parameters: { layout: 'padded' },
};

type Story = StoryObj<typeof ComparisonSheet>;

export const SideBySide: Story = {};
export default meta;
