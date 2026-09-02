import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { MemoryRouter } from 'react-router';
import { Paginator } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/Paginator',
  component: Paginator,
});

const Primary = meta.story({
  args: {
    currentPage: 8,
    totalPages: 576,
    buildUrl: (page: string) => `library/?q=(filters=('somefilters'),p=${page})`,
    preventScrollReset: true,
  },
  render: args => (
    <MemoryRouter>
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
    </MemoryRouter>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    currentPage: 8,
    totalPages: 576,
    buildUrl: (page: string) => `library/?q=(filters=('somefilters'),p=${page})`,
    preventScrollReset: true,
  },
});

export { Basic };
