import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';
import {
  CONSENT_EVENT,
  getConsent,
  removeLegacyConsentCookie,
  setConsent,
} from '#app/App/cookieConsent.js';

const Cookiepopup = ({ cookiepolicy }) => {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsentState] = useState(null);

  useEffect(() => {
    removeLegacyConsentCookie();
    setConsentState(getConsent());
    setMounted(true);
    const sync = () => setConsentState(getConsent());
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  // Banner is client-only: localStorage is not available during SSR.
  if (!mounted || !cookiepolicy || consent) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-auto z-50 flex w-fit justify-end">
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
    </div>
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
