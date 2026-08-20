/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import * as cookieConsent from '#app/App/cookieConsent.js';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';
import { CookiepopupView as Cookiepopup } from '../Cookiepopup.js';

jest.mock('#app/App/cookieConsent.js', () => ({
  CONSENT_EVENT: 'uwazi-cookie-consent',
  getConsent: jest.fn(),
  setConsent: jest.fn(),
  removeLegacyConsentCookie: jest.fn(),
}));

jest.mock('#V2/theme/ThemeProvider.js', () => ({
  ThemeProvider: ({ children }) => children,
}));

describe('Cookiepopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookieConsent.getConsent.mockReturnValue(null);
  });

  it('should render the consent banner when enabled and no choice was made', () => {
    const component = shallow(<Cookiepopup cookiepolicy />);
    expect(component.find(CookieConsentBanner).exists()).toBe(true);
  });

  it('should not render when cookie policy is disabled', () => {
    const component = shallow(<Cookiepopup cookiepolicy={false} />);
    expect(component.isEmptyRender()).toBe(true);
  });

  it('should not render when consent was already given', () => {
    cookieConsent.getConsent.mockReturnValue('accepted');
    const component = shallow(<Cookiepopup cookiepolicy />);
    expect(component.isEmptyRender()).toBe(true);
  });

  it('should save accepted consent', () => {
    const component = shallow(<Cookiepopup cookiepolicy />);
    component.find(CookieConsentBanner).prop('onAcceptAll')();
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('accepted');
  });

  it('should save essential-only consent', () => {
    const component = shallow(<Cookiepopup cookiepolicy />);
    component.find(CookieConsentBanner).prop('onEssentialOnly')();
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('essential');
  });

  it('should save rejected consent', () => {
    const component = shallow(<Cookiepopup cookiepolicy />);
    component.find(CookieConsentBanner).prop('onRejectAll')();
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('rejected');
  });
});
