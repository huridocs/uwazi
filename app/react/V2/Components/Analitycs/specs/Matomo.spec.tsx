/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai';
import { atomsGlobalState } from 'V2/shared/testingHelpers';
import { globalMatomoAtom, settingsAtom } from 'V2/atoms';
import { Matomo } from '../Matomo';

describe('Matomo', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    const mockLocation = new URL('https://mockedurl.com');
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  beforeEach(() => {
    window._paq = undefined;
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  const renderComponent = (store: any) => {
    render(
      <MemoryRouter>
        <Provider store={store}>
          <Matomo />
        </Provider>
      </MemoryRouter>
    );
  };

  it('should set the matomo config from the user config', () => {
    const store = atomsGlobalState();
    store.set(settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}' });

    renderComponent(store);

    expect(window._paq).toStrictEqual([
      ['setTrackerUrl', 'https://url.org/matomo.php'],
      ['setSiteId', '1'],
      ['setCustomUrl', 'https://mockedurl.com/'],
      ['deleteCustomVariables', 'page'],
      ['trackPageView'],
      ['enableLinkTracking'],
    ]);
  });

  it('should set the global matomo config', () => {
    const store = atomsGlobalState();
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '1' });

    renderComponent(store);

    expect(window._paq).toStrictEqual([
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '1'],
      ['setCustomUrl', 'https://mockedurl.com/'],
      ['deleteCustomVariables', 'page'],
      ['trackPageView'],
      ['enableLinkTracking'],
    ]);
  });

  it('should set both trackers when present', () => {
    const store = atomsGlobalState();
    store.set(settingsAtom, {
      matomoConfig: '{"url":"https://url.org/","id":"1"}',
    });
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '2' });

    renderComponent(store);

    expect(window._paq).toStrictEqual([
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '2'],
      ['addTracker', 'https://url.org/matomo.php', '1'],
      ['setCustomUrl', 'https://mockedurl.com/'],
      ['deleteCustomVariables', 'page'],
      ['trackPageView'],
      ['enableLinkTracking'],
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

    renderComponent(store);

    expect(window._paq).toStrictEqual(undefined);
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];
    const store = atomsGlobalState();
    store.set(settingsAtom, { matomoConfig: '{"url":"https://url.org/","id":"10"}' });
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '5' });

    renderComponent(store);

    expect(window._paq).toStrictEqual([
      ['googleTracker', 'idForTracker'],
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '5'],
      ['addTracker', 'https://url.org/matomo.php', '10'],
      ['setCustomUrl', 'https://mockedurl.com/'],
      ['deleteCustomVariables', 'page'],
      ['trackPageView'],
      ['enableLinkTracking'],
    ]);
  });

  it('should not break when the users configuration is malformed', () => {
    const store = atomsGlobalState();
    store.set(settingsAtom, { matomoConfig: '{ malformed: "3",  }' });
    store.set(globalMatomoAtom, { url: 'https://global.org', id: '3' });

    renderComponent(store);

    expect(window._paq).toStrictEqual([
      ['setTrackerUrl', 'https://global.org/tenant.php'],
      ['setSiteId', '3'],
      ['setCustomUrl', 'https://mockedurl.com/'],
      ['deleteCustomVariables', 'page'],
      ['trackPageView'],
      ['enableLinkTracking'],
    ]);
  });
});
