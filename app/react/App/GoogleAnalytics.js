import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {isClient} from 'app/utils';

export function trackPage() {
  if (isClient && window.ga) {
    window.ga('send', 'pageview');
  }
}

export class GoogleAnalytics extends Component {

  constructor(props) {
    super(props);
    if (!props.analyticsTrackingId || !isClient) {
      return;
    }
    /*eslint-disable */
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    window.ga('create', props.analyticsTrackingId, 'auto');
    trackPage();
    /*eslint-enable */
  }

  render() {
    if (!this.props.analyticsTrackingId) {
      return false;
    }
    return <script async src='https://www.google-analytics.com/analytics.js'></script>;
  }
}

GoogleAnalytics.propTypes = {
  analyticsTrackingId: PropTypes.string
};

export function mapStateToProps({settings}) {
  return {
    analyticsTrackingId: settings.collection.get('analyticsTrackingId')
  };
}

export default connect(mapStateToProps)(GoogleAnalytics);
