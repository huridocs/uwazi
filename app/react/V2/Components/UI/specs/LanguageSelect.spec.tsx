/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider, createStore } from 'jotai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { isMobileOverrideAtom } from '#V2/atoms/isMobileAtom.js';
import { LanguageSelect } from '../LanguageSelect.js';

const options = [
  { value: 'en', label: 'English', iso6391: 'en' },
  { value: 'es', label: 'Español', iso6391: 'es' },
] as const;

const renderSelect = ({
  isMobile,
  appearance = 'default',
}: {
  isMobile?: boolean;
  appearance?: 'default' | 'compact';
} = {}) => {
  const store = createStore();
  if (isMobile !== undefined) {
    store.set(isMobileOverrideAtom, isMobile);
  }
  const onChange = jest.fn();
  render(
    <Provider store={store}>
      <LanguageSelect
        value="en"
        options={options}
        onChange={onChange}
        aria-label="Language"
        appearance={appearance}
      />
    </Provider>
  );
  return { onChange };
};

describe('LanguageSelect', () => {
  it('shows the translated name on the desktop trigger and in option rows', async () => {
    renderSelect({ isMobile: false });

    expect(screen.getByRole('button', { name: 'Language' })).toHaveTextContent('English');

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'English',
      'Español',
    ]);
  });

  it('shows ISO 639-1 on the mobile trigger while options stay name-only', async () => {
    renderSelect({ isMobile: true });

    expect(screen.getByRole('button', { name: 'Language' })).toHaveTextContent('EN');

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual([
      'English',
      'Español',
    ]);
  });

  it('calls onChange with the selected value and closes', async () => {
    const { onChange } = renderSelect({ isMobile: false });

    await userEvent.click(screen.getByRole('button', { name: 'Language' }));
    await userEvent.click(screen.getByRole('option', { name: 'Español' }));

    expect(onChange).toHaveBeenCalledWith('es');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
