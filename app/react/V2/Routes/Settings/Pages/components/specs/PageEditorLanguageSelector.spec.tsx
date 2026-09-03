/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { localeAtom } from '#V2/atoms/index.js';
import { PageEditorLanguageSelector } from '../PageEditorLanguageSelector.js';

const languages = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
];

const renderSelector = ({
  uiLocale = 'en',
  activeLanguage = 'en',
  langs = languages,
}: {
  uiLocale?: string;
  activeLanguage?: string;
  langs?: typeof languages;
} = {}) => {
  const store = createStore();
  store.set(localeAtom, uiLocale);
  const onChange = jest.fn();
  render(
    <Provider store={store}>
      <PageEditorLanguageSelector
        languages={langs}
        activeLanguage={activeLanguage}
        onChange={onChange}
      />
    </Provider>
  );
  return { onChange };
};

describe('PageEditorLanguageSelector', () => {
  it('renders nothing when fewer than two languages are available', () => {
    renderSelector({ langs: [{ key: 'en', label: 'English', default: true }] });

    expect(screen.queryByTestId('page-editor-language-selector')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Page language' })).not.toBeInTheDocument();
  });

  it('lists languages as translated names in the UI locale, sorted alphabetically', async () => {
    renderSelector({ uiLocale: 'es' });

    await userEvent.click(screen.getByRole('button', { name: 'Page language' }));
    const options = screen.getAllByRole('option').map(option => option.textContent);

    expect(options).toEqual(['Español', 'Inglés']);
  });

  it('calls onChange when a different language is selected', async () => {
    const { onChange } = renderSelector();

    await userEvent.click(screen.getByRole('button', { name: 'Page language' }));
    await userEvent.click(screen.getByRole('option', { name: 'Spanish' }));

    expect(onChange).toHaveBeenCalledWith('es');
  });
});
