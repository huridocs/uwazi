import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { AlertBanner, ProgressBar, StatusBadge } from '#V2/Components/UI/index.js';

const FeedbackSheet = () => (
  <div className="tw-content max-w-md space-y-6 rounded-lg border border-border bg-paper p-5">
    <div className="space-y-3">
      <ProgressBar progress={72} color="primary" />
      <ProgressBar progress={100} color="success" />
      <ProgressBar progress={38} color="error" />
      <ProgressBar progress={0} color="gray" />
    </div>
    <div className="space-y-2">
      <AlertBanner variant="warning">
        3 rows were truncated to 255 characters during import.
      </AlertBanner>
      <AlertBanner variant="error">The import failed — the template no longer exists.</AlertBanner>
    </div>
    <div className="flex flex-wrap gap-2">
      <StatusBadge label="Completed" tone="success" />
      <StatusBadge label="Warnings" tone="warning" />
      <StatusBadge label="Processing" tone="carbon" />
      <StatusBadge label="Failed" tone="seal" />
      <StatusBadge label="Pending" tone="muted" />
    </div>
  </div>
);

const meta: Meta<typeof FeedbackSheet> = {
  title: 'Design System/Shared/Feedback',
  component: FeedbackSheet,
  parameters: { layout: 'padded' },
};

type Story = StoryObj<typeof FeedbackSheet>;

export const ProgressAndAlerts: Story = {};
export default meta;
