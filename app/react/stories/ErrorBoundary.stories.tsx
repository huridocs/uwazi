import React, { ComponentClass } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/ErrorHandl... Remove this comment to see the full error message
import { ErrorBoundary } from '../../V2/Components/ErrorHandling.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/ErrorHandl... Remove this comment to see the full error message
import type { ErrorBoundaryProps } from '../../V2/Components/ErrorHandling.js';

const meta: Meta<ComponentClass<ErrorBoundaryProps, any>> = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
};

type Story = StoryObj<typeof ErrorBoundary>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      // @ts-expect-error TS(2339): Property 'error' does not exist on type '{}'.
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
