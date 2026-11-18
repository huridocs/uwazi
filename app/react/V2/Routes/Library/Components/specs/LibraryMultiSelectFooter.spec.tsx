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

type FooterOptions = {
  user?: typeof adminUser | Record<string, never>;
  count?: number;
  onClear?: () => void;
};

const renderFooter = (onAction: jest.Mock = jest.fn(), options: FooterOptions = {}) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [translationsAtom, translations],
        [userAtom, options.user ?? adminUser],
      ]}
    >
      <LibraryMultiSelectFooter
        count={options.count ?? 2}
        onClear={options.onClear ?? (() => undefined)}
        onAction={onAction}
      />
    </TestAtomStoreProvider>
  );

const actions = () => screen.getByTestId('library-multi-select-actions');

const expectEditorButtons = () => {
  expect(within(actions()).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  expect(within(actions()).getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
  expect(within(actions()).queryByRole('button', { name: 'Permissions' })).not.toBeInTheDocument();
  expect(within(actions()).getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  expect(within(actions()).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
};

const openSelectedMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: '2 selected' }));
  return screen.getByRole('menu', { name: '2 selected' });
};

const expectSelectedMenu = (onClear: jest.Mock) => {
  const menu = openSelectedMenu();
  expect(within(menu).getByTestId('library-cherrypick-hint')).toBeInTheDocument();
  expect(within(menu).getByTestId('library-range-hint')).toBeInTheDocument();
  expect(
    within(menu).queryByRole('menuitem', { name: /Select this page/ })
  ).not.toBeInTheDocument();
  fireEvent.click(within(menu).getByRole('menuitem', { name: 'Clear selection' }));
  expect(onClear).toHaveBeenCalledTimes(1);
};

describe('LibraryMultiSelectFooter', () => {
  it('shows editor actions for admins', () => {
    const onAction = jest.fn();
    renderFooter(onAction);
    expectEditorButtons();
    fireEvent.click(within(actions()).getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Permissions' }));
    expect(onAction).toHaveBeenCalledWith('permissions');
    fireEvent.click(within(actions()).getByRole('button', { name: 'Edit' }));
    expect(onAction).toHaveBeenCalledWith('edit');
  });

  it('renames Select to the count and clears from that menu', () => {
    const onClear = jest.fn();
    renderFooter(jest.fn(), { onClear });
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Select' })).not.toBeInTheDocument();
    expectSelectedMenu(onClear);
  });

  it('labels a single selected record on the same menu', () => {
    renderFooter(jest.fn(), { count: 1 });
    expect(screen.getByRole('button', { name: '1 selected' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('hides editor actions for anonymous users and keeps Export CSV', () => {
    renderFooter(jest.fn(), { user: {} });
    expect(within(actions()).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(
      within(actions()).queryByRole('button', { name: 'Permissions' })
    ).not.toBeInTheDocument();
    expect(within(actions()).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(within(actions()).queryByTestId('library-footer-divider')).not.toBeInTheDocument();
    expect(within(actions()).getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 selected' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('disables Delete when 10000 or more entities are selected', () => {
    const onAction = jest.fn();
    const { rerender } = renderFooter(onAction, { count: 10000 });
    const deleteButton = within(actions()).getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute(
      'title',
      'You can delete at most 10,000 entities at once.'
    );
    fireEvent.click(deleteButton);
    expect(onAction).not.toHaveBeenCalled();

    rerender(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, adminUser],
        ]}
      >
        <LibraryMultiSelectFooter count={9999} onClear={() => undefined} onAction={onAction} />
      </TestAtomStoreProvider>
    );
    fireEvent.click(within(actions()).getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledWith('delete');
  });
});
