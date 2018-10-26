import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { isClient } from 'app/utils';

export function trackPage() {
  if (isClient && window.gtag) {
    window.gtag('send', 'pageview');
  }

  if (isClient && window._paq) {
    let currentUrl = window.location.href;
    window._paq.push(['setReferrerUrl', currentUrl]);
    currentUrl = '' + window.location.hash.substr(1);
    window._paq.push(['setCustomUrl', currentUrl]);
    // window._paq.push(['setDocumentTitle', 'My New Title']);

    // remove all previously assigned custom variables, requires Matomo (formerly Piwik) 3.0.2
    window._paq.push(['deleteCustomVariables', 'page']);
    window._paq.push(['setGenerationTimeMs', 0]);
    window._paq.push(['trackPageView']);

    // // make Matomo aware of newly added content
    // var content = document.getElementById('content');
    // window._paq.push(['MediaAnalytics::scanForMedia', content]);
    // window._paq.push(['FormAnalytics::scanForForms', content]);
    // window._paq.push(['trackContentImpressionsWithinNode', content]);
    // window._paq.push(['enableLinkTracking']);
  }
}

export class GoogleAnalytics extends Component {
  constructor(props) {
    super(props);
    if (!props.analyticsTrackingId || !isClient) {
      return;
    }
    /*eslint-disable */
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    }
    window.gtag('js', new Date());
    window.gtag('config', props.analyticsTrackingId);
    trackPage();
    /*eslint-enable */
  }

  render() {
    if (!this.props.analyticsTrackingId) {
      return false;
    }
    return <script async src={`https://www.googletagmanager.com/gtag/js?id=${this.props.analyticsTrackingId}`} />;
  }
}

GoogleAnalytics.defaultProps = {
  analyticsTrackingId: ''
};

GoogleAnalytics.propTypes = {
  analyticsTrackingId: PropTypes.string
};

export function mapStateToProps({ settings }) {
  return {
    analyticsTrackingId: settings.collection.get('analyticsTrackingId')
  };
}

export default connect(mapStateToProps)(GoogleAnalytics);
