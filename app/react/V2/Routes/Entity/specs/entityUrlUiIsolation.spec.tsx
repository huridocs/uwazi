/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router';
import { Provider } from 'jotai';
import { EntityUrlSync, useEntityHashUiParams, useEntitySearchParams } from '../entityUrlState.js';

let searchRenders = 0;
let hashRenders = 0;

const SearchProbe = React.memo(() => {
  useEntitySearchParams();
  searchRenders += 1;
  return null;
});

const HashProbe = React.memo(() => {
  useEntityHashUiParams();
  hashRenders += 1;
  return null;
});

const ChangeHash = () => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        void navigate({ search: '?m=metadata', hash: '#s=toc' });
      }}
    >
      side
    </button>
  );
};

describe('Entity URL UI contexts', () => {
  it('does not rerender memoized search consumers when only hash ui changes', () => {
    searchRenders = 0;
    hashRenders = 0;
    render(
      <MemoryRouter initialEntries={['/?m=metadata#s=search']}>
        <Provider>
          <EntityUrlSync>
            <SearchProbe />
            <HashProbe />
            <ChangeHash />
          </EntityUrlSync>
        </Provider>
      </MemoryRouter>
    );
    const searchCount = searchRenders;
    const hashCount = hashRenders;
    fireEvent.click(screen.getByRole('button', { name: 'side' }));
    expect(searchRenders).toBe(searchCount);
    expect(hashRenders).toBeGreaterThan(hashCount);
  });
});
