/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'jotai';
import { atomsGlobalState } from 'V2/shared/testingHelpers';
import { globalMatomoAtom, settingsAtom } from 'V2/atoms';
import { Matomo } from '../Matomo';

declare global {
  interface Window {
    _paq?: [string[]];
  }
}

describe('Matomo', () => {
  beforeEach(() => {
    window._paq = undefined;
  });

  it('should set the matomo config from the user config', () => {
    const store = atomsGlobalState();
    store.set(settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}' });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://url.org/matomo.php'],
      ['setSiteId', '1'],
    ]);
  });

  it('should set the global matomo config', () => {
    const store = atomsGlobalState();
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '1' });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '1'],
    ]);
  });

  it('should set both trackers when present', () => {
    const store = atomsGlobalState();
    store.set(settingsAtom, {
      matomoConfig: '{"url":"https://url.org/","id":"1"}',
    });
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '2' });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '2'],
      ['addTracker', 'https://url.org/matomo.php', '1'],
    ]);
  });

  it.each`
    userJSON     | globalUrl         | globalId
    ${undefined} | ${undefined}      | ${undefined}
    ${undefined} | ${'only.the.url'} | ${undefined}
    ${undefined} | ${undefined}      | ${'56'}
  `('should not include script when data is not available', ({ userJSON, globalUrl, globalId }) => {
    window._paq = undefined;
    const store = atomsGlobalState();

    store.set(settingsAtom, { matomoConfig: userJSON });
    store.set(globalMatomoAtom, { url: globalUrl, id: globalId });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual(undefined);
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];
    const store = atomsGlobalState();
    store.set(settingsAtom, { matomoConfig: '{"url":"https://url.org/","id":"10"}' });
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '5' });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['googleTracker', 'idForTracker'],
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '5'],
      ['addTracker', 'https://url.org/matomo.php', '10'],
    ]);
  });

  it('should not break when the users configuration is malformed', () => {
    const store = atomsGlobalState();
    store.set(settingsAtom, { matomoConfig: '{ malformed: "3",  }' });
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '3' });

    render(
      <Provider store={store}>
        <Matomo />
      </Provider>
    );

    expect(window._paq).toStrictEqual([
      ['trackPageView'],
      ['enableLinkTracking'],
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '3'],
    ]);
  });
});
