/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom } from '#V2/atoms/index.js';
import { DEFAULT_LIBRARY_URL_STATE } from '../../libraryUrlState.js';
import { LoadMore } from '../LoadMore.js';

const renderLoadMore = (loaded: number, total: number, onLoadMore = jest.fn()) => {
  render(
    <TestAtomStoreProvider initialValues={[[localeAtom, 'en']]}>
      <LoadMore loaded={loaded} total={total} onLoadMore={onLoadMore} />
    </TestAtomStoreProvider>
  );
  return onLoadMore;
};

describe('LoadMore', () => {
  it('renders a Show more control with the remaining count', () => {
    renderLoadMore(30, 4308);
    expect(screen.getByRole('button', { name: /Show more/ })).toHaveTextContent(
      'Show more — 4,278 remaining'
    );
  });

  it('loads another page of results', () => {
    const onLoadMore = renderLoadMore(30, 100);
    fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
    expect(onLoadMore).toHaveBeenCalledWith(DEFAULT_LIBRARY_URL_STATE.limit);
  });

  it('hides when every result is already loaded', () => {
    renderLoadMore(30, 30);
    expect(screen.queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
  });
});
