/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import * as cookieConsent from '#app/App/cookieConsent.js';
import { CookiepopupView as Cookiepopup } from '../Cookiepopup.js';

jest.mock('#app/App/cookieConsent.js', () => ({
  CONSENT_EVENT: 'uwazi-cookie-consent',
  getConsent: jest.fn(),
  setConsent: jest.fn(),
  removeLegacyConsentCookie: jest.fn(),
}));

describe('Cookiepopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookieConsent.getConsent.mockReturnValue(null);
  });

  it('should render the consent banner when enabled and no choice was made', () => {
    const component = shallow(
      <Cookiepopup cookiepolicy cookiePolicyPageUrl="/page/test" />
    );
    expect(component.find('[data-testid="cookie-consent-banner"]').exists()).toBe(true);
  });

  it('should not render when cookie policy is disabled', () => {
    const component = shallow(
      <Cookiepopup cookiepolicy={false} cookiePolicyPageUrl="" />
    );
    expect(component.isEmptyRender()).toBe(true);
  });

  it('should not render when consent was already given', () => {
    cookieConsent.getConsent.mockReturnValue('accepted');
    const component = shallow(
      <Cookiepopup cookiepolicy cookiePolicyPageUrl="" />
    );
    expect(component.isEmptyRender()).toBe(true);
  });

  it('should save consent when accept is clicked', () => {
    const component = shallow(<Cookiepopup cookiepolicy cookiePolicyPageUrl="" />);
    component.find('[data-testid="cookie-consent-accept"]').simulate('click');
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('accepted');
  });

  it('should save consent when reject is clicked', () => {
    const component = shallow(<Cookiepopup cookiepolicy cookiePolicyPageUrl="" />);
    component.find('[data-testid="cookie-consent-reject"]').simulate('click');
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('rejected');
  });
});
