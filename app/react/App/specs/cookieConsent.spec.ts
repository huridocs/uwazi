/**
 * @jest-environment jsdom
 */
import {
  CONSENT_EVENT,
  canUseNonEssentialCookies,
  getConsent,
  removeLegacyConsentCookie,
  resetConsent,
  setConsent,
} from '../cookieConsent.js';

describe('cookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null when no choice was made', () => {
    expect(getConsent()).toBeNull();
    expect(canUseNonEssentialCookies()).toBe(false);
  });

  it('should store accepted consent', () => {
    setConsent('accepted');
    expect(getConsent()).toBe('accepted');
    expect(canUseNonEssentialCookies()).toBe(true);
  });

  it('should store rejected consent', () => {
    setConsent('rejected');
    expect(getConsent()).toBe('rejected');
    expect(canUseNonEssentialCookies()).toBe(false);
  });

  it('should reset consent', () => {
    setConsent('accepted');
    resetConsent();
    expect(getConsent()).toBeNull();
  });

  it('should dispatch an event when consent changes', () => {
    const listener = jest.fn();
    window.addEventListener(CONSENT_EVENT, listener);
    setConsent('rejected');
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(CONSENT_EVENT, listener);
  });

  it('should remove the legacy cookiepolicy cookie', () => {
    document.cookie = 'cookiepolicy=1; path=/';
    removeLegacyConsentCookie();
    expect(document.cookie).not.toContain('cookiepolicy=');
  });
});
