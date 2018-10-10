import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { isClient } from 'app/utils';

export function trackPage() {
  if (isClient && window.gtag) {
    window.gtag('send', 'pageview');
  }
}

export default class GoogleAnalytics extends Component {
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
