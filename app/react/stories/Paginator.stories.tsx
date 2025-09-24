import React from 'react';
import { MemoryRouter } from 'react-router';
import type { Meta, StoryObj } from '@storybook/react';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Paginator } from '../../V2/Components/UI.js';

const meta: Meta<typeof Paginator> = {
  title: 'Components/Paginator',
  component: Paginator,
};

type Story = StoryObj<typeof Paginator>;

const Primary: Story = {
  render: args => (
    <MemoryRouter>
      <div className="tw-content">
        <div className="container w-full">
          <Paginator
            // @ts-expect-error TS(2339): Property 'currentPage' does not exist on type '{}'... Remove this comment to see the full error message
            currentPage={args.currentPage}
            // @ts-expect-error TS(2339): Property 'totalPages' does not exist on type '{}'.
            totalPages={args.totalPages}
            // @ts-expect-error TS(2339): Property 'buildUrl' does not exist on type '{}'.
            buildUrl={args.buildUrl}
            // @ts-expect-error TS(2339): Property 'preventScrollReset' does not exist on ty... Remove this comment to see the full error message
            preventScrollReset={args.preventScrollReset}
          />
        </div>
      </div>
    </MemoryRouter>
  ),
};

const Basic: Story = {
  ...Primary,
  args: {
    currentPage: 8,
    totalPages: 576,
    buildUrl: (page: string) => `library/?q=(filters=('somefilters'),p=${page})`,
    preventScrollReset: true,
  },
};

export { Basic };

export default meta;
