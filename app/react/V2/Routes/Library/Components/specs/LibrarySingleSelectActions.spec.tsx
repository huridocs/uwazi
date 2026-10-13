/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibrarySingleSelectActions } from '../LibrarySingleSelectActions.js';

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

const renderActions = (
  props: { onEdit?: jest.Mock; onAction?: jest.Mock } = {},
  user: typeof adminUser | Record<string, never> = adminUser
) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, user],
        ]}
      >
        <LibrarySingleSelectActions
          onClose={() => undefined}
          onEdit={props.onEdit}
          onAction={props.onAction}
          includeViewEntity={false}
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

const actionBar = () => screen.getByTestId('library-single-select-actions');

describe('LibrarySingleSelectActions', () => {
  it('shows Edit, Permissions and Delete for admins', () => {
    const onEdit = jest.fn();
    const onAction = jest.fn();
    renderActions({ onEdit, onAction });
    fireEvent.click(within(actionBar()).getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    fireEvent.click(within(actionBar()).getByRole('button', { name: 'Permissions' }));
    expect(onAction).toHaveBeenCalledWith('permissions');
    fireEvent.click(within(actionBar()).getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledWith('delete');
  });

  it('hides editor actions for anonymous users', () => {
    renderActions({}, {});
    expect(screen.queryByTestId('library-single-select-actions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Permissions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
