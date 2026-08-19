import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { I18NLink, Translate } from '#app/I18N/index.js';
import {
  CONSENT_EVENT,
  getConsent,
  removeLegacyConsentCookie,
  setConsent,
} from '#app/App/cookieConsent.js';

const Cookiepopup = ({ cookiepolicy, cookiePolicyPageUrl }) => {
  const [consent, setConsentState] = useState(() => getConsent());

  useEffect(() => {
    removeLegacyConsentCookie();
    const sync = () => setConsentState(getConsent());
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!cookiepolicy || consent) {
    return null;
  }

  const handleChoice = value => {
    setConsent(value);
    setConsentState(value);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-lg"
      role="dialog"
      aria-live="polite"
      data-testid="cookie-consent-banner"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          <Translate>
            This site uses cookies for language preferences and analytics. Session cookies are only
            set when you log in.
          </Translate>
          {cookiePolicyPageUrl && (
            <>
              {' '}
              <I18NLink to={cookiePolicyPageUrl} className="underline">
                <Translate>Learn more</Translate>
              </I18NLink>
            </>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleChoice('rejected')}
            data-testid="cookie-consent-reject"
          >
            <Translate>Reject non-essential</Translate>
          </button>
          <button
            type="button"
            className="rounded bg-primary-700 px-4 py-2 text-sm text-white hover:bg-primary-800"
            onClick={() => handleChoice('accepted')}
            data-testid="cookie-consent-accept"
          >
            <Translate>Accept all</Translate>
          </button>
        </div>
      </div>
    </div>
  );
};

Cookiepopup.propTypes = {
  cookiepolicy: PropTypes.bool.isRequired,
  cookiePolicyPageUrl: PropTypes.string,
};

Cookiepopup.defaultProps = {
  cookiePolicyPageUrl: '',
};

const mapStateToProps = state => ({
  cookiepolicy: Boolean(state.settings.collection.get('cookiepolicy')),
  cookiePolicyPageUrl: state.settings.collection.get('cookiePolicyPageUrl') || '',
});

const CookiepopupConnected = connect(mapStateToProps)(Cookiepopup);
export { Cookiepopup as CookiepopupView, CookiepopupConnected as Cookiepopup };
