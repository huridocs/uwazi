import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const MatomoComponent = ({ id, url }) => {
  // eslint-disable-next-line max-statements
  useEffect(() => {
    if (!id && !url) {
      return;
    }

    const _paq = window._paq || [];

    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    const u = url.replace(/\/?$/, '/');
    _paq.push(['setTrackerUrl', `${u}piwik.php`]);
    _paq.push(['setSiteId', id]);
    const d = document;
    const g = d.createElement('script');
    const s = d.getElementsByTagName('script')[0];
    g.type = 'text/javascript';
    g.async = true;
    g.defer = true;
    g.src = `${u}piwik.js`;
    s.parentNode.insertBefore(g, s);
  }, [id, url]);

  return undefined;
};

MatomoComponent.defaultProps = {
  id: '',
  url: '',
};

MatomoComponent.propTypes = {
  id: PropTypes.string,
  url: PropTypes.string,
};

function mapStateToProps({ settings }) {
  try {
    const { id, url } = JSON.parse(settings.collection.get('matomoConfig'));
    return { id, url };
  } catch (e) {
    return {};
  }
}

const Matomo = connect(mapStateToProps)(MatomoComponent);

export { Matomo, MatomoComponent, mapStateToProps };
