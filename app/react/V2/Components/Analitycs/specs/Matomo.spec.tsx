/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { CONSENT_EVENT, canUseNonEssentialCookies } from '#app/App/cookieConsent.js';
import { globalMatomoAtom, settingsAtom } from '#V2/atoms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { Matomo } from '../Matomo.js';

jest.mock('#app/App/cookieConsent.js', () => ({
  CONSENT_EVENT: 'uwazi-cookie-consent',
  canUseNonEssentialCookies: jest.fn(() => true),
}));

const renderComponent = (
  storeState: Array<[typeof globalMatomoAtom | typeof settingsAtom, unknown]>
) => {
  render(
    <MemoryRouter>
      <TestAtomStoreProvider initialValues={storeState}>
        <Matomo />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );
};

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
    jest.mocked(canUseNonEssentialCookies).mockReturnValue(true);
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  describe('trackers', () => {
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
    `(
      'should not include script when data is not available',
      ({ userJSON, globalUrl, globalId }) => {
        window._paq = undefined;

        const settingsValue = { matomoConfig: userJSON };
        const globalMatomoValue = { url: globalUrl, id: globalId };

        renderComponent([
          [globalMatomoAtom, globalMatomoValue],
          [settingsAtom, settingsValue],
        ]);

        expect(window._paq).toStrictEqual(undefined);
      }
    );

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

  describe('cookie consent', () => {
    it('should track when cookie policy is off, without consent', () => {
      jest.mocked(canUseNonEssentialCookies).mockReturnValue(false);

      renderComponent([
        [settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}', cookiepolicy: false }],
      ]);

      expect(window._paq).toStrictEqual([
        ['setTrackerUrl', 'https://url.org/matomo.php'],
        ['setSiteId', '1'],
        ['setCustomUrl', 'https://mockedurl.com/'],
        ['deleteCustomVariables', 'page'],
        ['trackPageView'],
        ['enableLinkTracking'],
      ]);
    });

    it('should not track when cookie policy is on and consent was not accepted', () => {
      jest.mocked(canUseNonEssentialCookies).mockReturnValue(false);

      renderComponent([
        [settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}', cookiepolicy: true }],
      ]);

      expect(window._paq).toBeUndefined();
    });

    it('should track when consent is accepted after the page has mounted', () => {
      jest.mocked(canUseNonEssentialCookies).mockReturnValue(false);
      renderComponent([
        [settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}', cookiepolicy: true }],
      ]);

      jest.mocked(canUseNonEssentialCookies).mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event(CONSENT_EVENT));
      });

      expect(window._paq).toStrictEqual([
        ['setTrackerUrl', 'https://url.org/matomo.php'],
        ['setSiteId', '1'],
        ['setCustomUrl', 'https://mockedurl.com/'],
        ['deleteCustomVariables', 'page'],
        ['trackPageView'],
        ['enableLinkTracking'],
      ]);
    });

    it('should not load the platform tracker until consent is accepted', () => {
      jest.mocked(canUseNonEssentialCookies).mockReturnValue(false);
      renderComponent([
        [settingsAtom, { matomoConfig: '{"url":"https://url.org/","id":"1"}', cookiepolicy: true }],
        [globalMatomoAtom, { url: 'https://global.org', id: '2' }],
      ]);

      expect(window._paq).toBeUndefined();

      jest.mocked(canUseNonEssentialCookies).mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event(CONSENT_EVENT));
      });

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

    it('should not send another page view when consent is withdrawn', () => {
      renderComponent([
        [settingsAtom, { matomoConfig: '{"url":"https://url.org","id":"1"}', cookiepolicy: true }],
      ]);
      const sent = window._paq?.length;

      jest.mocked(canUseNonEssentialCookies).mockReturnValue(false);
      act(() => {
        window.dispatchEvent(new Event(CONSENT_EVENT));
      });

      expect(window._paq?.length).toBe(sent);
    });
  });
});
