/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'jotai';
import { atomsGlobalState } from 'V2/shared/testingHelpers';
import { settingsAtom } from 'V2/atoms';
import { Matomo } from '../Matomo';

declare global {
  interface Window {
    _paq?: [string[]];
  }
}

describe('Matomo', () => {
  const store = atomsGlobalState();

  beforeEach(() => {
    window._paq = undefined;
  });

  it('should set the matomo config from the user config', () => {
    store.set(settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}' });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://url.org/piwik.php'],
      ['setSiteId', '1'],
    ]);
  });

  it('should set the global matomo config', () => {
    store.set(settingsAtom, { globalMatomo: { url: 'https://global.org', id: '1' } });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['addTracker', 'https://global.org', '1'],
    ]);
  });

  it('should set both trackers when present', () => {
    store.set(settingsAtom, {
      matomoConfig: '{"url":"https://url.org/","id":"1"}',
      globalMatomo: { url: 'https://global.org', id: '2' },
    });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://url.org/piwik.php'],
      ['setSiteId', '1'],
      ['addTracker', 'https://global.org', '2'],
    ]);
  });

  it.each`
    userJSON     | globalUrl         | globalId
    ${undefined} | ${undefined}      | ${undefined}
    ${undefined} | ${'only.the.url'} | ${undefined}
    ${undefined} | ${undefined}      | ${'56'}
  `('should not include script when data is not available', ({ userJSON, globalUrl, globalId }) => {
    window._paq = undefined;

    store.set(settingsAtom, {
      matomoConfig: userJSON,
      globalMatomo: { url: globalUrl, id: globalId },
    });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual(undefined);
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];
    store.set(settingsAtom, {
      matomoConfig: '{"url":"https://url.org/","id":"10"}',
      globalMatomo: { url: 'https://global.org', id: '5' },
    });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['googleTracker', 'idForTracker'],
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://url.org/piwik.php'],
      ['setSiteId', '10'],
      ['addTracker', 'https://global.org', '5'],
    ]);
  });
});
