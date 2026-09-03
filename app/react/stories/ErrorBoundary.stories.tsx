import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { ErrorBoundary } from '#V2/Components/ErrorHandling/index.js';

const meta = preview.meta({
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
});

const Primary = meta.story({
  render: args => (
    <div className="tw-content">
      <ErrorBoundary error={args.error}>{args.children}</ErrorBoundary>
    </div>
  ),
});

const BasicErrorBoundary = storyExtend(Primary, {
  args: {
    error: {
      status: 500,
      message: 'Internal server error',
      name: 'Server Error',
    },
    children: <span className="mb-8 text-3xl font-extrabold text-gray-900 ">Error-Free</span>,
  },
});

export { BasicErrorBoundary };
