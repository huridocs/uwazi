/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { ClientTranslationSchema } from '#app/istore.js';
import { get } from '#V2/api/translations/index.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import {
  mergeLocaleTranslations,
  useEnsureLocaleTranslations,
} from '../useEnsureLocaleTranslations.js';

jest.mock('#V2/api/translations/index.js', () => ({
  get: jest.fn(),
}));

const getMock = jest.mocked(get);

const Harness = ({ language }: { language: string }) => {
  const ready = useEnsureLocaleTranslations(language);
  return <span data-testid="ready">{ready ? 'yes' : 'no'}</span>;
};

describe('mergeLocaleTranslations', () => {
  const en: ClientTranslationSchema = {
    locale: 'en',
    contexts: [{ id: 'System', label: 'System', values: { Search: 'Search' } }],
  };
  const es: ClientTranslationSchema = {
    locale: 'es',
    contexts: [{ id: 'System', label: 'System', values: { Search: 'Buscar' } }],
  };

  it('adds missing locales from incoming', () => {
    expect(mergeLocaleTranslations([en], [en, es])).toEqual([en, es]);
  });

  it('keeps existing locales when incoming repeats them', () => {
    const updatedEn: ClientTranslationSchema = {
      locale: 'en',
      contexts: [{ id: 'System', label: 'System', values: { Search: 'Updated' } }],
    };
    expect(mergeLocaleTranslations([en], [updatedEn, es])).toEqual([en, es]);
  });
});

describe('useEnsureLocaleTranslations', () => {
  const en: ClientTranslationSchema = {
    locale: 'en',
    contexts: [{ id: 'System', label: 'System', values: { Search: 'Search' } }],
  };
  const es: ClientTranslationSchema = {
    locale: 'es',
    contexts: [{ id: 'System', label: 'System', values: { Search: 'Buscar' } }],
  };

  beforeEach(() => {
    getMock.mockReset();
  });

  it('fetches and merges missing locale translations', async () => {
    const store = createStore();
    store.set(translationsAtom, [en]);
    store.set(localeAtom, 'en');
    getMock.mockResolvedValue([es]);

    const { getByTestId } = render(
      <Provider store={store}>
        <Harness language="es" />
      </Provider>
    );

    expect(getByTestId('ready').textContent).toBe('no');
    await waitFor(() => {
      expect(store.get(translationsAtom).map(row => row.locale)).toEqual(['en', 'es']);
    });
    expect(getByTestId('ready').textContent).toBe('yes');
    expect(getMock).toHaveBeenCalledWith(undefined, { locale: 'es' });
  });

  it('does not fetch when locale is already present', async () => {
    const store = createStore();
    store.set(translationsAtom, [en, es]);
    store.set(localeAtom, 'en');

    const { getByTestId } = render(
      <Provider store={store}>
        <Harness language="es" />
      </Provider>
    );

    expect(getByTestId('ready').textContent).toBe('yes');
    await act(async () => undefined);
    expect(getMock).not.toHaveBeenCalled();
  });

  it('ignores fetch failures', async () => {
    const store = createStore();
    store.set(translationsAtom, [en]);
    store.set(localeAtom, 'en');
    getMock.mockRejectedValue(new Error('network'));

    render(
      <Provider store={store}>
        <Harness language="es" />
      </Provider>
    );

    await act(async () => undefined);
    expect(store.get(translationsAtom)).toEqual([en]);
  });

  it('ignores late fetch results after unmount', async () => {
    const store = createStore();
    store.set(translationsAtom, [en]);
    store.set(localeAtom, 'en');
    let resolveFetch: (value: ClientTranslationSchema[]) => void = () => undefined;
    getMock.mockImplementation(
      async () =>
        new Promise(resolve => {
          resolveFetch = resolve;
        })
    );

    const { unmount } = render(
      <Provider store={store}>
        <Harness language="es" />
      </Provider>
    );
    unmount();
    await act(async () => {
      resolveFetch([es]);
    });
    expect(store.get(translationsAtom)).toEqual([en]);
  });
});
