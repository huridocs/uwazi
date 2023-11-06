import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const MatomoComponent = ({ id, url }) => {
  // eslint-disable-next-line max-statements
  useEffect(() => {
    if (!id || !url) {
      return;
    }

    // eslint-disable-next-line no-multi-assign
    const _paq = (window._paq = window._paq || []);

    const matomoUrl = url.replace(/\/?$/, '/');

    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    _paq.push(['setTrackerUrl', `${matomoUrl}piwik.php`]);
    _paq.push(['setSiteId', id]);

    const g = document.createElement('script');
    g.type = 'text/javascript';
    g.async = true;
    g.defer = true;
    g.src = `${matomoUrl}piwik.js`;
    g.id = 'matomo-script';

    const s = document.getElementById('matomo-script');
    s?.parentNode.insertBefore(g, s);
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
