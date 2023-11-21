import { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

const MatomoComponent = ({ id, url }) => {
  useEffect(() => {
    if (id && url) {
      const matomoUrl = url.replace(/\/?$/, '/');

      const script = document.createElement('script');

      script.innerHTML = `
      var _paq = _paq || [];
      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        var u="${matomoUrl}";
        _paq.push(['setTrackerUrl', u+'piwik.php']);
        _paq.push(['setSiteId', '${id}']);
        var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
        g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
      })();`;

      document.body.appendChild(script);
    }
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
