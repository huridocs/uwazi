/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import type { Entity } from '#V2/api/entities/types.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { localeAtom, settingsAtom, translationsAtom } from '#V2/atoms/index.js';
import {
  getTranslationLocaleOverride,
  useTranslationLocale,
} from '#app/I18N/TranslationLocaleContext.js';
import { useEnsureLocaleTranslations } from '#app/I18N/useEnsureLocaleTranslations.js';
import { EntityProvider } from '../EntityContext.js';
import { EntityLanguageProvider } from '../EntityLanguageContext.js';

jest.mock('#app/I18N/useEnsureLocaleTranslations.js', () => ({
  useEnsureLocaleTranslations: jest.fn(),
}));

jest.mock('../hooks/useEntityLanguageState.js', () => ({
  useEntityLanguageState: () => ({
    language: 'es',
    mainDocument: undefined,
    pagePlaintext: undefined,
    isLoading: false,
    setLanguage: jest.fn(),
  }),
}));

const ensureMock = jest.mocked(useEnsureLocaleTranslations);

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'es',
  metadata: {},
  creationDate: 0,
  user: 'user1',
};

const LocaleProbe = ({ routeLocale }: { routeLocale: string }) => {
  const locale = useTranslationLocale(routeLocale);
  return <span data-testid="locale">{locale}</span>;
};

const renderProvider = () =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
        [localeAtom, 'en'],
        [translationsAtom, []],
      ]}
    >
      <EntityProvider entity={entity}>
        <EntityLanguageProvider loaderEntity={entity} initialLanguage="es">
          <LocaleProbe routeLocale="en" />
        </EntityLanguageProvider>
      </EntityProvider>
    </TestAtomStoreProvider>
  );

describe('EntityLanguageProvider', () => {
  beforeEach(() => {
    ensureMock.mockReset();
  });

  afterEach(() => {
    expect(getTranslationLocaleOverride()).toBeNull();
  });

  it('calls useEnsureLocaleTranslations and wraps with TranslationLocaleProvider when ready', () => {
    ensureMock.mockReturnValue(true);
    const { getByTestId, unmount } = renderProvider();
    expect(ensureMock).toHaveBeenCalledWith('es');
    expect(getByTestId('locale').textContent).toBe('es');
    expect(getTranslationLocaleOverride()).toBe('es');
    unmount();
  });

  it('defers TranslationLocaleProvider until locale translations are ready', () => {
    ensureMock.mockReturnValue(false);
    const { getByTestId, unmount } = renderProvider();
    expect(ensureMock).toHaveBeenCalledWith('es');
    expect(getByTestId('locale').textContent).toBe('en');
    expect(getTranslationLocaleOverride()).toBeNull();
    unmount();
  });
});
