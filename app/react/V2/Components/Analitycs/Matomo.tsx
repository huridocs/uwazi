import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { useLocation } from 'react-router';
import { CONSENT_EVENT, canUseNonEssentialCookies } from '#app/App/cookieConsent.js';
import { globalMatomoAtom, settingsAtom } from '#V2/atoms/index.js';
import { isClient } from '#app/utils/index.js';

const buildScript = ({
  globalUrl,
  globalId,
  userUrl,
  userId,
}: {
  globalUrl?: string;
  globalId?: string;
  userUrl?: string;
  userId?: string;
}) => {
  const userMatomoUrl = userUrl?.replace(/\/?$/, '/');
  const globalMatomoUrl = globalUrl?.replace(/\/?$/, '/');

  const mainUrl = globalMatomoUrl || userMatomoUrl;
  const mainId = globalId || userId;
  const filename = globalMatomoUrl ? 'tenant' : 'matomo';

  return `
  var _paq = _paq || [];
  (function () {
    var url = "${mainUrl}";
    _paq.push(["setTrackerUrl", url + "${filename}.php"]);
    _paq.push(["setSiteId", "${mainId}"]);
    ${userMatomoUrl && globalMatomoUrl ? `_paq.push(["addTracker", "${userMatomoUrl}matomo.php", "${userId}"]);` : ''}
    var d = document,
      g = d.createElement("script"),
      s = d.getElementsByTagName("script")[0];
    g.type = "text/javascript";
    g.async = true;
    g.defer = true;
    g.src = url + "${filename}.js";
    s.parentNode.insertBefore(g, s);
  })();`;
};

const parseMatomoConfig = (matomoConfig?: string) => {
  try {
    return JSON.parse(matomoConfig || '{}') as { id?: string; url?: string };
  } catch (_error) {
    return {};
  }
};

const matomoSnippet = ({
  id,
  url,
  globalId,
  globalUrl,
}: {
  id?: string;
  url?: string;
  globalId?: string;
  globalUrl?: string;
}) => {
  const hasUserMatomo = Boolean(id && url);
  const hasGlobalMatomo = Boolean(globalUrl && globalId);
  if (hasGlobalMatomo && hasUserMatomo) {
    return buildScript({ globalUrl, globalId, userUrl: url, userId: id });
  }
  if (hasGlobalMatomo) {
    return buildScript({ globalUrl, globalId });
  }
  if (hasUserMatomo) {
    return buildScript({ userUrl: url, userId: id });
  }
  return '';
};

const appendInlineScript = (scriptContent: string) => {
  const script = document.createElement('script');
  script.innerHTML = scriptContent;
  document.body.appendChild(script);
};

const useAnalyticsAllowed = (cookiepolicy?: boolean) => {
  const [, rememberConsent] = useState(0);

  useEffect(() => {
    const onConsent = () => rememberConsent(version => version + 1);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return !cookiepolicy || canUseNonEssentialCookies();
};

const trackMatomoPage = () => {
  if (!isClient || !window._paq) {
    return;
  }
  window._paq.push(['setCustomUrl', window.location.href]);
  window._paq.push(['deleteCustomVariables', 'page']);
  window._paq.push(['trackPageView']);
  window._paq.push(['enableLinkTracking']);
};

const Matomo = () => {
  const scriptIsPresent = useRef(false);
  const location = useLocation();
  const { matomoConfig, cookiepolicy } = useAtomValue(settingsAtom);
  const { id: globalId, url: globalUrl } = useAtomValue(globalMatomoAtom) || {};
  const { id, url } = parseMatomoConfig(matomoConfig);
  const allowed = useAnalyticsAllowed(cookiepolicy);

  useEffect(() => {
    if (!allowed || scriptIsPresent.current) {
      return;
    }
    const scriptContent = matomoSnippet({ id, url, globalId, globalUrl });
    if (!scriptContent) {
      return;
    }
    appendInlineScript(scriptContent);
    scriptIsPresent.current = true;
  }, [allowed, globalId, globalUrl, id, url]);

  useEffect(() => {
    if (!allowed) {
      return;
    }
    trackMatomoPage();
  }, [allowed, location]);

  return null;
};

export { Matomo };
