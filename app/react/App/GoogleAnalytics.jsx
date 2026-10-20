import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import { CONSENT_EVENT, canUseNonEssentialCookies } from '#app/App/cookieConsent.js';
import { isClient } from '#app/utils/index.js';

let trackingEnabled = false;
let lastTrackedWith = null;
let lastPageLocation = '';

const setTrackingEnabled = enabled => {
  trackingEnabled = enabled;
};

const gtagSrc = trackingId => `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;

function trackPage() {
  if (!isClient || !trackingEnabled || typeof window.gtag !== 'function') {
    return;
  }
  if (lastTrackedWith !== window.gtag) {
    lastTrackedWith = window.gtag;
    lastPageLocation = '';
  }
  const pageLocation = window.location.href;
  if (pageLocation === lastPageLocation) {
    return;
  }
  lastPageLocation = pageLocation;
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: pageLocation,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

function installGtag(trackingId) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // The dataLayer consumer expects the Arguments object, not a rest array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', trackingId, { send_page_view: false });
  trackPage();
}

function appendGtagScript(trackingId) {
  const script = document.createElement('script');
  script.async = true;
  script.src = gtagSrc(trackingId);
  document.head.appendChild(script);
}

const tagAllowed = (trackingId, cookiepolicy) =>
  Boolean(trackingId) && (!cookiepolicy || canUseNonEssentialCookies());

function ensureTag(trackingId, cookiepolicy, installedId) {
  const allowed = isClient && tagAllowed(trackingId, cookiepolicy);
  setTrackingEnabled(allowed);
  if (!allowed) {
    return;
  }
  if (installedId.current !== trackingId) {
    installGtag(trackingId);
    appendGtagScript(trackingId);
    installedId.current = trackingId;
    return;
  }
  trackPage();
}

const GoogleAnalytics = ({ analyticsTrackingId = '', cookiepolicy = false }) => {
  const installedId = useRef('');

  useEffect(() => {
    if (!isClient) {
      return undefined;
    }
    const onConsentChange = () => {
      ensureTag(analyticsTrackingId, cookiepolicy, installedId);
    };
    window.addEventListener(CONSENT_EVENT, onConsentChange);
    onConsentChange();
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsentChange);
      setTrackingEnabled(false);
    };
  }, [analyticsTrackingId, cookiepolicy]);

  return null;
};

GoogleAnalytics.propTypes = {
  analyticsTrackingId: PropTypes.string,
  cookiepolicy: PropTypes.bool,
};

function mapStateToProps({ settings }) {
  return {
    analyticsTrackingId: settings.collection.get('analyticsTrackingId'),
    cookiepolicy: Boolean(settings.collection.get('cookiepolicy')),
  };
}

const GoogleAnalyticsConnected = connect(mapStateToProps)(GoogleAnalytics);
export {
  GoogleAnalytics as GoogleAnalyticsView,
  GoogleAnalyticsConnected as GoogleAnalytics,
  trackPage,
  mapStateToProps,
};
