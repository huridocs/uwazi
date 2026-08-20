/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
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

  it('should render the banner on the client when enabled and no choice was made', async () => {
    render(<Cookiepopup cookiepolicy />);
    await waitFor(() => {
      expect(document.querySelector('[data-testid="cookie-consent-banner"]')).not.toBeNull();
    });
  });

  it('should not render when cookie policy is disabled', async () => {
    render(<Cookiepopup cookiepolicy={false} />);
    await act(async () => {});
    expect(document.querySelector('[data-testid="cookie-consent-banner"]')).toBeNull();
  });

  it('should not render when consent was already given', async () => {
    cookieConsent.getConsent.mockReturnValue('accepted');
    render(<Cookiepopup cookiepolicy />);
    await act(async () => {});
    expect(document.querySelector('[data-testid="cookie-consent-banner"]')).toBeNull();
  });

  it('should save accepted consent', async () => {
    render(<Cookiepopup cookiepolicy />);
    await waitFor(() => {
      expect(document.querySelector('[data-testid="cookie-consent-accept-all"]')).not.toBeNull();
    });
    fireEvent.click(document.querySelector('[data-testid="cookie-consent-accept-all"]'));
    expect(cookieConsent.setConsent).toHaveBeenCalledWith('accepted');
  });
});
