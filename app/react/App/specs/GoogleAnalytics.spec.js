/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { fromJS } from 'immutable';
import { CONSENT_EVENT, canUseNonEssentialCookies } from '#app/App/cookieConsent.js';
import { GoogleAnalyticsView, mapStateToProps, trackPage } from '../GoogleAnalytics.js';

jest.mock('#app/App/cookieConsent.js', () => ({
  CONSENT_EVENT: 'uwazi-cookie-consent',
  canUseNonEssentialCookies: jest.fn(() => false),
}));

const trackingId = 'G-TEST';
const scriptSelector = `script[src="https://www.googletagmanager.com/gtag/js?id=${trackingId}"]`;

const pageViews = () =>
  Array.from(window.dataLayer || []).filter(
    entry => entry[0] === 'event' && entry[1] === 'page_view'
  );

const configCalls = () => Array.from(window.dataLayer || []).filter(entry => entry[0] === 'config');

const resetAnalyticsDom = () => {
  delete window.gtag;
  delete window.dataLayer;
  document.title = 'Library';
  window.history.replaceState({}, '', '/library?q=1');
  document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(node => {
    node.remove();
  });
};

const renderAnalytics = ({ analyticsTrackingId = trackingId, cookiepolicy = false } = {}) =>
  render(
    <GoogleAnalyticsView analyticsTrackingId={analyticsTrackingId} cookiepolicy={cookiepolicy} />
  );

describe('GoogleAnalytics', () => {
  beforeEach(() => {
    canUseNonEssentialCookies.mockReturnValue(false);
    resetAnalyticsDom();
  });

  afterEach(() => {
    cleanup();
  });

  it('should load the tag when cookie policy is off, without consent', () => {
    renderAnalytics();

    expect(window.gtag).toEqual(jasmine.any(Function));
    expect(document.querySelector(scriptSelector)).not.toBeNull();
    expect(Array.from(configCalls()[0])).toEqual(['config', trackingId, { send_page_view: false }]);
    expect(document.querySelectorAll(scriptSelector).length).toBe(1);
  });

  it('should not load the tag when cookie policy is on and consent was not accepted', () => {
    renderAnalytics({ cookiepolicy: true });

    expect(window.gtag).not.toBeDefined();
    expect(document.querySelector(scriptSelector)).toBeNull();
    expect(pageViews().length).toBe(0);
  });

  it('should load the tag when cookie policy is on and consent was already accepted', () => {
    canUseNonEssentialCookies.mockReturnValue(true);
    renderAnalytics({ cookiepolicy: true });

    expect(window.gtag).toEqual(jasmine.any(Function));
    expect(document.querySelector(scriptSelector)).not.toBeNull();
    expect(Array.from(configCalls()[0])).toEqual(['config', trackingId, { send_page_view: false }]);
  });

  it('should load the tag when consent is accepted after the page has mounted', () => {
    renderAnalytics({ cookiepolicy: true });
    canUseNonEssentialCookies.mockReturnValue(true);

    act(() => {
      window.dispatchEvent(new Event(CONSENT_EVENT));
    });

    expect(window.gtag).toEqual(jasmine.any(Function));
    expect(document.querySelector(scriptSelector)).not.toBeNull();
    expect(pageViews().length).toBe(1);
  });

  it('should not load the tag when the tracking id is empty', () => {
    renderAnalytics({ analyticsTrackingId: '' });

    expect(window.gtag).not.toBeDefined();
    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull();
  });

  it('should load the tag when the tracking id arrives after mount', () => {
    const view = render(<GoogleAnalyticsView analyticsTrackingId="" cookiepolicy={false} />);
    view.rerender(<GoogleAnalyticsView analyticsTrackingId={trackingId} cookiepolicy={false} />);

    expect(document.querySelector(scriptSelector)).not.toBeNull();
    expect(pageViews().length).toBe(1);
  });

  it('should read the tracking id and cookie policy from settings', () => {
    expect(
      mapStateToProps({
        settings: {
          collection: fromJS({ analyticsTrackingId: 'G-1', cookiepolicy: true }),
        },
      })
    ).toEqual({ analyticsTrackingId: 'G-1', cookiepolicy: true });
  });

  describe('trackPage', () => {
    it('should send one page_view per url', () => {
      renderAnalytics();

      expect(Array.from(pageViews()[0])).toEqual([
        'event',
        'page_view',
        {
          page_title: 'Library',
          page_location: window.location.href,
          page_path: '/library?q=1',
        },
      ]);

      trackPage();
      expect(pageViews().length).toBe(1);

      document.title = 'Entity';
      window.history.replaceState({}, '', '/entity/abc');
      trackPage();

      expect(pageViews().length).toBe(2);
      expect(Array.from(pageViews()[1])[2]).toEqual({
        page_title: 'Entity',
        page_location: window.location.href,
        page_path: '/entity/abc',
      });
    });

    it('should stop sending page views when consent is withdrawn', () => {
      canUseNonEssentialCookies.mockReturnValue(true);
      renderAnalytics({ cookiepolicy: true });
      expect(pageViews().length).toBe(1);
      const sent = pageViews().length;

      canUseNonEssentialCookies.mockReturnValue(false);
      act(() => {
        window.dispatchEvent(new Event(CONSENT_EVENT));
      });
      window.history.replaceState({}, '', '/other');
      trackPage();

      expect(pageViews().length).toBe(sent);
    });

    it('should do nothing when gtag is not defined', () => {
      delete window.gtag;
      expect(trackPage).not.toThrow();
    });
  });
});
