import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class Matomo extends Component {
  render() {
    if (!this.props.id && !this.props.url) {
      return false;
    }

    const url = this.props.url.replace(/\/?$/, '/');

    return (
      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `
              var _paq = _paq || [];
              _paq.push(['trackPageView']);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="${url}";
                _paq.push(['setTrackerUrl', u+'piwik.php']);
                _paq.push(['setSiteId', '${this.props.id}']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
              })();
        `,
        }}
      />
    );
  }
}

Matomo.defaultProps = {
  id: '',
  url: '',
};

Matomo.propTypes = {
  id: PropTypes.string,
  url: PropTypes.string,
};

export function mapStateToProps({ settings }) {
  try {
    const { id, url } = JSON.parse(settings.collection.get('matomoConfig'));
    return { id, url };
  } catch (e) {
    return {};
  }
}

export default connect(mapStateToProps)(Matomo);
