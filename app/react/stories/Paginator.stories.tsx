import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import type { Meta, StoryObj } from '@storybook/react';
import { Paginator } from 'app/V2/Components/UI';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof Paginator> = {
  title: 'Components/Paginator',
  component: Paginator,
};

type Story = StoryObj<typeof Paginator>;

const Primary: Story = {
  render: args => (
    <MemoryRouter>
      <Provider store={createStore()}>
        <div className="tw-content">
          <div className="container w-full">
            <Paginator
              currentPage={args.currentPage}
              totalPages={args.totalPages}
              buildUrl={args.buildUrl}
              preventScrollReset={args.preventScrollReset}
            />
          </div>
        </div>
      </Provider>
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
