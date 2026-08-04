/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UpdateEntityUrlOptions } from '../../../entityUrlState.js';
import { SEARCH_PARAM } from '../../../urlParams.js';
import { SearchTabFooter } from '../SearchTabFooter.js';

const mockUpdateEntityUrl: jest.Mock<(args: UpdateEntityUrlOptions) => void> = jest.fn();

jest.mock('#app/I18N/index.js', () => ({
  t: (_ctx: string, key: string) => key,
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('#V2/Routes/Entity/entityUrlState.js', () => ({
  useUpdateEntityUrl: () => mockUpdateEntityUrl,
}));

describe('SearchTabFooter', () => {
  beforeEach(() => {
    mockUpdateEntityUrl.mockClear();
  });

  it('inserts tip example into SEARCH_PARAM and closes the tips panel', async () => {
    const user = userEvent.setup();
    render(
      <div className="tw-content">
        <SearchTabFooter />
      </div>
    );

    await user.click(screen.getByRole('button', { name: 'Search tips' }));
    expect(screen.getByRole('dialog', { name: 'Search tips' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Search: juris*' }));

    expect(mockUpdateEntityUrl).toHaveBeenCalledTimes(1);
    const updateArg = mockUpdateEntityUrl.mock.calls[0]?.[0];
    expect(updateArg).toBeDefined();
    if (!updateArg) {
      throw new Error('expected updateEntityUrl argument');
    }
    const params = new URLSearchParams();
    updateArg.hash?.(params);
    expect(params.get(SEARCH_PARAM)).toBe('juris*');
    expect(screen.queryByRole('dialog', { name: 'Search tips' })).not.toBeInTheDocument();
  });
});
