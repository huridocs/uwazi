import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms';

const Matomo = () => {
  // WIP: currently users Matomo is stored as a string like:
  // '{"url":"https://matomo.huridata.org","id":"123"}'.
  // The global one could be just a json with url and id

  const { matomoConfig, globalMatomo } = useAtomValue(settingsAtom);
  const { id, url } = JSON.parse(matomoConfig || '{}') as { id?: string; url?: string };
  const { id: secondaryWebsiteId, url: secondaryTracker } = globalMatomo || {
    id: '1',
    secondaryUrl: 'wip.huridata.org',
  };

  useEffect(() => {
    const script = document.createElement('script');
    const hasUserMatomo = Boolean(id && url);
    const hasGlobalMatomo = Boolean(secondaryWebsiteId && secondaryTracker);
    const matomoUrl = url?.replace(/\/?$/, '/');

    switch (true) {
      case hasGlobalMatomo && !hasUserMatomo:
        script.innerHTML = `
        var _paq = _paq || [];
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          _paq.push(['addTracker', ${secondaryTracker}, ${secondaryWebsiteId}]);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
        })();`;
        break;

      case !hasGlobalMatomo && hasUserMatomo:
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
        break;

      case hasGlobalMatomo && hasUserMatomo:
        script.innerHTML = `
            var _paq = _paq || [];
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="${matomoUrl}";
              _paq.push(['setTrackerUrl', u+'piwik.php']);
              _paq.push(['setSiteId', '${id}']);
              _paq.push(['addTracker', ${secondaryTracker}, ${secondaryWebsiteId}]);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'piwik.js'; s.parentNode.insertBefore(g,s);
            })();`;
        break;

      default:
        break;
    }

    if (hasUserMatomo || hasGlobalMatomo) {
      document.body.appendChild(script);
    }
  }, [id, secondaryTracker, secondaryWebsiteId, url]);

  return undefined;
};

export { Matomo };
