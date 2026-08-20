/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
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

  afterEach(() => {
    cleanup();
  });

  it('should portal the banner to document.body when enabled', () => {
    render(<Cookiepopup cookiepolicy />);
    expect(document.body.querySelector('[data-testid="cookie-consent-float"]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid="cookie-consent-banner"]')).not.toBeNull();
  });

  it('should position the float at the bottom-right of the viewport', () => {
    render(<Cookiepopup cookiepolicy />);
    const float = document.body.querySelector('[data-testid="cookie-consent-float"]');
    expect(float.style.right).toBe('1rem');
    expect(float.style.bottom).toBe('1rem');
    expect(float.style.position).toBe('fixed');
  });

  it('should not render when cookie policy is disabled', () => {
    render(<Cookiepopup cookiepolicy={false} />);
    expect(document.body.querySelector('[data-testid="cookie-consent-float"]')).toBeNull();
  });

  it('should not render when consent was already given', () => {
    cookieConsent.getConsent.mockReturnValue('accepted');
    render(<Cookiepopup cookiepolicy />);
    expect(document.body.querySelector('[data-testid="cookie-consent-float"]')).toBeNull();
  });

  it('should save accepted consent', () => {
    render(<Cookiepopup cookiepolicy />);
    fireEvent.click(document.body.querySelector('[data-testid="cookie-consent-accept-all"]'));
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('accepted');
  });

  it('should save essential-only consent', () => {
    render(<Cookiepopup cookiepolicy />);
    fireEvent.click(document.body.querySelector('[data-testid="cookie-consent-essential"]'));
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('essential');
  });

  it('should save rejected consent', () => {
    render(<Cookiepopup cookiepolicy />);
    fireEvent.click(document.body.querySelector('[data-testid="cookie-consent-reject-all"]'));
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('rejected');
  });
});
