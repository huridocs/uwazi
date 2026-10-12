/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryMultiSelectFooter } from '../LibraryMultiSelectFooter.js';

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

const renderFooter = (
  onAction: jest.Mock = jest.fn(),
  user: typeof adminUser | Record<string, never> = adminUser
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [translationsAtom, translations],
        [userAtom, user],
      ]}
    >
      <LibraryMultiSelectFooter
        count={2}
        loadedIds={['a', 'b']}
        selectedIds={['a', 'b']}
        onClear={() => undefined}
        onSelectLoaded={() => undefined}
        onDeselectLoaded={() => undefined}
        onAction={onAction}
      />
    </TestAtomStoreProvider>
  );

const actions = () => screen.getByTestId('library-multi-select-actions');

describe('LibraryMultiSelectFooter', () => {
  it('shows editor actions for admins', () => {
    const onAction = jest.fn();
    renderFooter(onAction);
    expect(within(actions()).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(actions()).getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(within(actions()).getByRole('button', { name: 'Permissions' })).toBeInTheDocument();
    expect(within(actions()).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    fireEvent.click(within(actions()).getByRole('button', { name: 'Edit' }));
    expect(onAction).toHaveBeenCalledWith('edit');
  });

  it('hides editor actions for anonymous users and keeps Export CSV', () => {
    renderFooter(jest.fn(), {});
    expect(within(actions()).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(
      within(actions()).queryByRole('button', { name: 'Permissions' })
    ).not.toBeInTheDocument();
    expect(within(actions()).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(within(actions()).queryByTestId('library-footer-divider')).not.toBeInTheDocument();
    expect(within(actions()).getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });
});
