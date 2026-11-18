/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { LibraryResultsFooter } from '../LibraryResultsFooter.js';
import { LibrarySelectMenu } from '../LibrarySelectMenu.js';

const adminUser = { _id: 'admin1', role: 'admin', username: 'admin', email: 'admin@uwazi.io' };

const renderSelect = (pageCount: number, onSelectPage: () => void) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, adminUser],
        ]}
      >
        <LibraryResultsFooter pageCount={pageCount} onSelectPage={onSelectPage} />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

const openSelect = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Select' }));
  return screen.getByRole('menu', { name: 'Select' });
};

const openSelected = () => {
  const trigger = screen.getByRole('button', { name: '4 selected' });
  expect(trigger.querySelector('.whitespace-nowrap')).toHaveTextContent('4 selected');
  expect(trigger.querySelectorAll('svg')).toHaveLength(1);
  fireEvent.click(trigger);
  return screen.getByRole('menu', { name: '4 selected' });
};

const expectSelectHints = (menu: HTMLElement) => {
  const cherry = within(menu).getByTestId('library-cherrypick-hint');
  expect(cherry).toHaveTextContent('Cherrypick');
  expect(cherry).toHaveTextContent(/Click records to add them\./);
  const range = within(menu).getByTestId('library-range-hint');
  expect(range).toHaveTextContent('Range');
  expect(range).toHaveTextContent(/Hold Shift and click/);
  expect(
    within(menu).queryByRole('menuitem', { name: /Cherrypick|Range/ })
  ).not.toBeInTheDocument();
  expect(within(menu).queryByRole('button', { name: /Cherrypick|Range/ })).not.toBeInTheDocument();
};

describe('LibrarySelectMenu', () => {
  it('selects this page and keeps Cherrypick as a hint', () => {
    const onSelectPage = jest.fn();
    renderSelect(30, onSelectPage);
    const menu = openSelect();
    expectSelectHints(menu);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Select this page (30)' }));
    expect(onSelectPage).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: 'Select' })).not.toBeInTheDocument();
  });

  it('renames the trigger and offers Clear selection', () => {
    const onClear = jest.fn();
    const onSelectPage = jest.fn();
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [translationsAtom, translations],
          [userAtom, adminUser],
        ]}
      >
        <LibrarySelectMenu
          withTrigger
          pageCount={30}
          selectedCount={4}
          onClear={onClear}
          onSelectPage={onSelectPage}
        />
      </TestAtomStoreProvider>
    );
    const menu = openSelected();
    expectSelectHints(menu);
    expect(
      within(menu).queryByRole('menuitem', { name: /Select this page/ })
    ).not.toBeInTheDocument();
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onSelectPage).not.toHaveBeenCalled();
  });

  it('does not select an empty page', () => {
    const onSelectPage = jest.fn();
    renderSelect(0, onSelectPage);
    const item = within(openSelect()).getByRole('menuitem', { name: 'Select this page (0)' });
    expect(item).toBeDisabled();
    fireEvent.click(item);
    expect(onSelectPage).not.toHaveBeenCalled();
  });
});
