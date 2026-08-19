import * as Cookie from 'tiny-cookie';
import { isClient } from '#app/utils/index.js';

const STORAGE_KEY = 'uwazi_cookie_consent';
const CONSENT_EVENT = 'uwazi-cookie-consent';

type CookieConsent = 'accepted' | 'rejected';

const getConsent = (): CookieConsent | null => {
  if (!isClient) {
    return null;
  }
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === 'accepted' || value === 'rejected') {
    return value;
  }
  return null;
};

const setConsent = (value: CookieConsent) => {
  if (!isClient) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

const resetConsent = () => {
  if (!isClient) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CONSENT_EVENT));
};

const canUseNonEssentialCookies = () => getConsent() === 'accepted';

const removeLegacyConsentCookie = () => {
  if (!isClient) {
    return;
  }
  if (Cookie.get('cookiepolicy')) {
    Cookie.remove('cookiepolicy');
  }
};

export {
  CONSENT_EVENT,
  getConsent,
  setConsent,
  resetConsent,
  canUseNonEssentialCookies,
  removeLegacyConsentCookie,
};
export type { CookieConsent };
