/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { LanguageDropdown } from '../LanguageDropdown.js';
import { followLanguageUrl } from '../followLanguageUrl.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../followLanguageUrl', () => ({
  followLanguageUrl: jest.fn(),
}));

const language = ({
  key,
  label,
  localizedLabel,
  isDefault = false,
}: {
  key: LanguageISO6391;
  label: string;
  localizedLabel: string;
  isDefault?: boolean;
}) => ({
  key,
  label,
  localized_label: localizedLabel,
  default: isDefault,
});

const renderDropdown = () =>
  render(
    <MemoryRouter initialEntries={['/en/library']}>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [
            settingsAtom,
            {
              languages: [
                language({
                  key: 'en',
                  label: 'English',
                  localizedLabel: 'English',
                  isDefault: true,
                }),
                language({ key: 'es', label: 'Spanish', localizedLabel: 'Español' }),
              ],
            },
          ],
        ]}
      >
        <LanguageDropdown />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('LanguageDropdown', () => {
  it('switches language with the shared selector', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(screen.getByRole('option', { name: 'Español' }));

    expect(followLanguageUrl).toHaveBeenCalledWith('/es/library');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
