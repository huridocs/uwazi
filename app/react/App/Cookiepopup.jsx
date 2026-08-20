import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';
import { ThemeProvider } from '#V2/theme/ThemeProvider.js';
import {
  CONSENT_EVENT,
  getConsent,
  removeLegacyConsentCookie,
  setConsent,
} from '#app/App/cookieConsent.js';

const Cookiepopup = ({ cookiepolicy }) => {
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

  return (
    <ThemeProvider className="fixed bottom-4 right-4 z-50">
      <CookieConsentBanner
        onAcceptAll={() => {
          setConsent('accepted');
          setConsentState('accepted');
        }}
        onEssentialOnly={() => {
          setConsent('essential');
          setConsentState('essential');
        }}
        onRejectAll={() => {
          setConsent('rejected');
          setConsentState('rejected');
        }}
      />
    </ThemeProvider>
  );
};

Cookiepopup.propTypes = {
  cookiepolicy: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  cookiepolicy: Boolean(state.settings.collection.get('cookiepolicy')),
});

const CookiepopupConnected = connect(mapStateToProps)(Cookiepopup);
export { Cookiepopup as CookiepopupView, CookiepopupConnected as Cookiepopup };
