/**
 * TEMPORARY — Entity Viewer V2 soft-deploy (issue #9522).
 *
 * Delete this module (and its SSR + client call sites) once V2 is the only viewer
 * and legacy URL shapes are no longer accepted:
 *   - /document/:sharedId(...)
 *   - /entity/:sharedId/<anything>  (old V1 tabs / unmatched paths), when the flag is ON
 *
 * Redirect status: 301 Moved Permanently.
 * Reason: these URL shapes are permanently replaced by the canonical /entity/:sharedId
 * (no tab segment, no legacy query). Crawlers and bookmarks should update to that URL.
 * The React <Navigate> fallbacks remain only as a client-side safety net for in-app
 * navigations that never hit SSR.
 */

const ENTITY_VIEWER_LEGACY_REDIRECT_STATUS = 301;

type EntityViewerLegacyRedirectOptions = {
  languageKeys?: string[];
  /** When true, also redirect /entity/:id/<extra> → /entity/:id */
  entityViewerV2?: boolean;
};

type EntityViewerLegacyRedirect = {
  status: typeof ENTITY_VIEWER_LEGACY_REDIRECT_STATUS;
  pathname: string;
};

const stripLanguagePrefix = (
  pathname: string,
  languageKeys: string[]
): { langPrefix: string; pathWithoutLang: string } => {
  const segments = pathname.split('/').filter(Boolean);
  const maybeLang = segments[0];
  if (maybeLang && languageKeys.includes(maybeLang)) {
    return {
      langPrefix: `/${maybeLang}`,
      pathWithoutLang: `/${segments.slice(1).join('/')}`,
    };
  }
  return { langPrefix: '', pathWithoutLang: pathname.startsWith('/') ? pathname : `/${pathname}` };
};

/**
 * Returns a 301 target pathname (no query/hash) when the request should leave a legacy
 * entity/document URL, or null when SSR should continue normally.
 */
const getEntityViewerLegacyRedirect = (
  pathname: string,
  options: EntityViewerLegacyRedirectOptions = {}
): EntityViewerLegacyRedirect | null => {
  const languageKeys = options.languageKeys || [];
  const { langPrefix, pathWithoutLang } = stripLanguagePrefix(pathname, languageKeys);

  const documentMatch = pathWithoutLang.match(/^\/document\/([^/]+)(?:\/.*)?$/);
  if (documentMatch) {
    return {
      status: ENTITY_VIEWER_LEGACY_REDIRECT_STATUS,
      pathname: `${langPrefix}/entity/${documentMatch[1]}`,
    };
  }

  if (options.entityViewerV2) {
    // Exact /entity/:sharedId is the V2 viewer — do not redirect.
    // Any extra segment(s) are deprecated V1 tabs / unmatched paths.
    const entityExtraMatch = pathWithoutLang.match(/^\/entity\/([^/]+)\/.+$/);
    if (entityExtraMatch) {
      return {
        status: ENTITY_VIEWER_LEGACY_REDIRECT_STATUS,
        pathname: `${langPrefix}/entity/${entityExtraMatch[1]}`,
      };
    }
  }

  return null;
};

export { ENTITY_VIEWER_LEGACY_REDIRECT_STATUS, getEntityViewerLegacyRedirect };
export type { EntityViewerLegacyRedirect, EntityViewerLegacyRedirectOptions };
