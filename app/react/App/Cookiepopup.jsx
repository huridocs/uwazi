import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { connect } from 'react-redux';
import { CookieConsentBanner } from '#V2/Components/UI/CookieConsentBanner.js';
import {
  CONSENT_EVENT,
  getConsent,
  removeLegacyConsentCookie,
  setConsent,
} from '#app/App/cookieConsent.js';

const floatStyle = {
  position: 'fixed',
  right: '1rem',
  bottom: '1rem',
  width: 'fit-content',
  maxWidth: 'calc(100vw - 2rem)',
  zIndex: 50,
};

const Cookiepopup = ({ cookiepolicy }) => {
  const [consent, setConsentState] = useState(() => getConsent());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    removeLegacyConsentCookie();
    const sync = () => setConsentState(getConsent());
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  if (!mounted || !cookiepolicy || consent) {
    return null;
  }

  return createPortal(
    <div style={floatStyle} data-testid="cookie-consent-float">
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
    </div>,
    document.body
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
