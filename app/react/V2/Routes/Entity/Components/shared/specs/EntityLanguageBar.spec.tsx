/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { localeAtom } from '#V2/atoms/index.js';
import { EntityLanguageBar } from '../EntityLanguageBar.js';

const mockLanguageBar = {
  isEditing: false,
  isDirty: false,
  isSaving: false,
  cancelEdit: jest.fn(),
  setLanguage: jest.fn().mockResolvedValue(undefined),
};

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useEntityLanguage: () => ({
    language: 'en',
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
    isLoading: false,
    setLanguage: mockLanguageBar.setLanguage,
  }),
  useMetadataEditing: () => ({
    isEditing: mockLanguageBar.isEditing,
    isDirty: mockLanguageBar.isDirty,
    isSaving: mockLanguageBar.isSaving,
    cancelEdit: mockLanguageBar.cancelEdit,
  }),
}));

describe('EntityLanguageBar', () => {
  beforeEach(() => {
    mockLanguageBar.isEditing = false;
    mockLanguageBar.isDirty = false;
    mockLanguageBar.isSaving = false;
    mockLanguageBar.cancelEdit.mockClear();
    mockLanguageBar.setLanguage.mockClear();
  });

  it('lists languages as translated names in the UI locale, sorted alphabetically', async () => {
    const store = createStore();
    store.set(localeAtom, 'es');
    render(
      <Provider store={store}>
        <EntityLanguageBar />
      </Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    const options = screen.getAllByRole('option').map(option => option.textContent);

    expect(options).toEqual(['Español', 'Inglés']);
  });

  it('confirms before switching language when metadata edits are dirty', async () => {
    mockLanguageBar.isEditing = true;
    mockLanguageBar.isDirty = true;
    const store = createStore();
    store.set(localeAtom, 'en');
    render(
      <Provider store={store}>
        <EntityLanguageBar />
      </Provider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(screen.getByRole('option', { name: 'Spanish' }));

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(mockLanguageBar.setLanguage).not.toHaveBeenCalled();
    expect(mockLanguageBar.cancelEdit).not.toHaveBeenCalled();
  });
});
