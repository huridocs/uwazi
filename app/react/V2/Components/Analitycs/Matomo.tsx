import { useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { settingsAtom } from 'V2/atoms';

const Matomo = () => {
  const { matomoConfig } = useAtomValue(settingsAtom);
  const { id, url } = JSON.parse(matomoConfig || '');

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

export { Matomo };
