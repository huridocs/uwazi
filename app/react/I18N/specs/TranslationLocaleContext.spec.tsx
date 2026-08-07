/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { localeAtom, translationsAtom, inlineEditAtom } from '#V2/atoms/index.js';
import { Translate } from '../Translate.js';
import {
  getTranslationLocaleOverride,
  TranslationLocaleProvider,
  useTranslationLocale,
} from '../TranslationLocaleContext.js';
import { translations } from './fixtures.js';

const LocaleProbe = ({ routeLocale }: { routeLocale: string }) => {
  const locale = useTranslationLocale(routeLocale);
  return <span data-testid="locale">{locale}</span>;
};

describe('TranslationLocaleProvider', () => {
  it('sets override while mounted and clears on unmount', () => {
    const Probe = () => {
      expect(getTranslationLocaleOverride()).toBe('es');
      return null;
    };
    const { unmount } = render(
      <TranslationLocaleProvider locale="es">
        <Probe />
      </TranslationLocaleProvider>
    );
    expect(getTranslationLocaleOverride()).toBe('es');
    unmount();
    expect(getTranslationLocaleOverride()).toBeNull();
  });

  it('updates override when locale changes', () => {
    const { rerender, unmount } = render(
      <TranslationLocaleProvider locale="es">
        <span />
      </TranslationLocaleProvider>
    );
    expect(getTranslationLocaleOverride()).toBe('es');
    rerender(
      <TranslationLocaleProvider locale="fr">
        <span />
      </TranslationLocaleProvider>
    );
    expect(getTranslationLocaleOverride()).toBe('fr');
    unmount();
    expect(getTranslationLocaleOverride()).toBeNull();
  });

  it('useTranslationLocale falls back to route locale outside the provider', () => {
    const { getByTestId } = render(<LocaleProbe routeLocale="en" />);
    expect(getByTestId('locale').textContent).toBe('en');
  });

  it('scopes Translate labels without affecting siblings outside the provider', () => {
    const { getByText } = render(
      <TestAtomStoreProvider
        initialValues={[
          [translationsAtom, translations],
          [localeAtom, 'en'],
          [inlineEditAtom, { inlineEdit: false, context: '', translationKey: '' }],
        ]}
      >
        <TranslationLocaleProvider locale="es">
          <Translate context="System" translationKey="Search">
            Search
          </Translate>
        </TranslationLocaleProvider>
        <Translate context="System" translationKey="Search">
          Search
        </Translate>
      </TestAtomStoreProvider>
    );
    expect(getByText('Buscar')).toBeInTheDocument();
    expect(getByText('Search')).toBeInTheDocument();
  });
});
