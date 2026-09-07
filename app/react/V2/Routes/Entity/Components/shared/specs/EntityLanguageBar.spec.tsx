/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { localeAtom } from '#V2/atoms/index.js';
import { EntityLanguageBar } from '../EntityLanguageBar.js';

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useEntityLanguage: () => ({
    language: 'en',
    languages: [
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ],
    isLoading: false,
    setLanguage: jest.fn().mockResolvedValue(undefined),
  }),
  useMetadataEditing: () => ({
    isEditing: false,
    isDirty: false,
    isSaving: false,
    cancelEdit: jest.fn(),
  }),
}));

describe('EntityLanguageBar', () => {
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
});
