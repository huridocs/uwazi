import React, { ComponentClass } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from 'app/V2/Components/ErrorHandling';
import type { ErrorBoundaryProps } from 'app/V2/Components/ErrorHandling';

const meta: Meta<ComponentClass<ErrorBoundaryProps, any>> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
};

type Story = StoryObj<typeof ErrorBoundary>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <ErrorBoundary error={args.error}>{args.children}</ErrorBoundary>
    </div>
  ),
};

const BasicErrorBoundary: Story = {
  ...Primary,
  args: {
    error: {
      status: 500,
      message: 'Internal server error',
      name: 'Server Error',
    },
    children: <span className="mb-8 text-3xl font-extrabold text-gray-900 ">Error-Free</span>,
  },
};

export { BasicErrorBoundary };

export default meta;
