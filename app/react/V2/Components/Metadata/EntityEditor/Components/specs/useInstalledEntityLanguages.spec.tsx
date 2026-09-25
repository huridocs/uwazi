/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { localeAtom, settingsAtom } from '#V2/atoms/index.js';
import { useInstalledEntityLanguages } from '../useInstalledEntityLanguages.js';

const Probe = () => {
  const { current, languages } = useInstalledEntityLanguages();
  return (
    <span>
      {current}:{languages.join(',')}
    </span>
  );
};

describe('useInstalledEntityLanguages', () => {
  it('uses the UI locale when entity language context is missing', () => {
    const store = createStore();
    store.set(settingsAtom, {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    });
    store.set(localeAtom, 'es');
    render(
      <Provider store={store}>
        <Probe />
      </Provider>
    );
    expect(screen.getByText('es:en,es')).toBeInTheDocument();
  });
});
