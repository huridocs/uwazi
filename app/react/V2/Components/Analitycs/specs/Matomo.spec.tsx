/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { globalMatomoAtom, settingsAtom } from 'V2/atoms';
import { TestAtomStoreProvider } from 'V2/testing';
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

  const renderComponent = (storeState: any) => {
    render(
      <MemoryRouter>
        <TestAtomStoreProvider initialValues={storeState}>
          <Matomo />
        </TestAtomStoreProvider>
      </MemoryRouter>
    );
  };

  it('should set the matomo config from the user config', () => {
    const atomStoreValue = { matomoConfig: '{"url":"https://url.org","id":"1"}' };

    renderComponent([[settingsAtom, atomStoreValue]]);

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
    const atomStoreValue = { url: 'https://global.org', id: '1' };

    renderComponent([[globalMatomoAtom, atomStoreValue]]);

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
    const settingsValue = {
      matomoConfig: '{"url":"https://url.org/","id":"1"}',
    };
    const globalMatomoValue = { url: 'https://global.org', id: '2' };

    renderComponent([
      [globalMatomoAtom, globalMatomoValue],
      [settingsAtom, settingsValue],
    ]);

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

    const settingsValue = { matomoConfig: userJSON };
    const globalMatomoValue = { url: globalUrl, id: globalId };

    renderComponent([
      [globalMatomoAtom, globalMatomoValue],
      [settingsAtom, settingsValue],
    ]);

    expect(window._paq).toStrictEqual(undefined);
  });

  it('should not pollute existing keys in the window object', () => {
    window._paq = [['googleTracker', 'idForTracker']];

    const settingsValue = { matomoConfig: '{"url":"https://url.org/","id":"10"}' };
    const globalMatomoValue = { url: 'https://global.org', id: '5' };

    renderComponent([
      [globalMatomoAtom, globalMatomoValue],
      [settingsAtom, settingsValue],
    ]);

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
    const settingsValue = { matomoConfig: '{ malformed: "3",  }' };
    const globalMatomoValue = { url: 'https://global.org', id: '3' };

    renderComponent([
      [globalMatomoAtom, globalMatomoValue],
      [settingsAtom, settingsValue],
    ]);

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
