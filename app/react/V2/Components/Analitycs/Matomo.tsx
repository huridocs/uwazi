import React, { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms';

const Matomo = () => {
  // WIP: currently users Matomo is stored as a string like:
  // '{"url":"https://matomo.huridata.org","id":"123"}'.
  // The global one could be just a json with url and id

  let id: string | undefined;
  let url: string | undefined;

  const { matomoConfig, globalMatomo } = useAtomValue(settingsAtom);

  try {
    ({ id, url } = JSON.parse(matomoConfig || '{}') as { id?: string; url?: string });
    //silent fail
    // eslint-disable-next-line no-empty
  } catch (e) {}

  const { id: secondaryWebsiteId, url: secondaryUrl } = globalMatomo || {};

  useEffect(() => {
    const script = document.createElement('script');
    const hasUserMatomo = Boolean(id && url);
    const hasGlobalMatomo = Boolean(secondaryWebsiteId && secondaryUrl);
    const matomoUrl = url?.replace(/\/?$/, '/');

    switch (true) {
      case hasGlobalMatomo && !hasUserMatomo:
        script.innerHTML = `
        var _paq = _paq || [];
        _paq.push(['trackPageView']);
        _paq.push(['enableLinkTracking']);
        (function() {
          var u="${secondaryUrl}";
          _paq.push(['addTracker', '${secondaryUrl}', '${secondaryWebsiteId}']);
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
              _paq.push(['addTracker', '${secondaryUrl}', '${secondaryWebsiteId}']);
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
  }, [id, secondaryUrl, secondaryWebsiteId, url]);

  return <div className="hidden" />;
};

export { Matomo };
