import { serializeEntityHash } from '#V2/Routes/Entity/entityUrlAtoms.js';
import { SIDE_TAB } from '#V2/Routes/Entity/Tabs/tabIds.js';
import { PAGE_PARAM, SEARCH_PARAM, SIDE_TAB_PARAM } from '#V2/Routes/Entity/urlParams.js';

type SnippetLinkParams = {
  sharedId: string;
  searchTerm?: string;
  page?: string | number;
  filename?: string;
  /** When true, /entity is the V2 viewer (feature flag ON). */
  entityViewerV2?: boolean;
  /** Base path override for V1 viewer mounted at /legacy-entity. */
  legacyBasePath?: string;
};

const ENTITY_PATH = '/entity';
const ENTITY_V2_PATH = '/entityv2';
const LEGACY_ENTITY_PATH = '/legacy-entity';

const isEntityViewerV2Enabled = (features?: { [key: string]: unknown } | null): boolean =>
  Boolean(features?.featureFlagEntityViewerv2);

/** Default public path for the V2 entity viewer (depends on soft-deploy flag). */
const getEntityViewerV2BasePath = (entityViewerV2: boolean): string =>
  entityViewerV2 ? ENTITY_PATH : ENTITY_V2_PATH;

/** V1 entity viewer base path (legacy mount when V2 owns /entity). */
const getEntityViewerV1BasePath = (entityViewerV2: boolean): string =>
  entityViewerV2 ? LEGACY_ENTITY_PATH : ENTITY_PATH;

const getEntityViewerV2Path = (sharedId: string, entityViewerV2: boolean): string =>
  `${getEntityViewerV2BasePath(entityViewerV2)}/${sharedId}`;

const isLegacyEntityPath = (pathname: string): boolean =>
  /(?:^|\/)legacy-entity(?:\/|$)/.test(pathname);

const isEntityV2Path = (pathname: string): boolean => /(?:^|\/)entityv2(?:\/|$)/.test(pathname);

/** True when pathname is the /entity viewer (not legacy-entity / entityv2). */
const isEntityPath = (pathname: string): boolean =>
  /(?:^|\/)entity(?:\/|$)/.test(pathname) &&
  !isEntityV2Path(pathname) &&
  !isLegacyEntityPath(pathname);

/**
 * V1 tab links must stay on the current V1 mount (/entity or /legacy-entity).
 */
const getV1EntityBasePathFromLocation = (pathname: string): string =>
  isLegacyEntityPath(pathname) ? LEGACY_ENTITY_PATH : ENTITY_PATH;

const buildV1SnippetLink = ({
  sharedId,
  searchTerm,
  page,
  filename,
  legacyBasePath = ENTITY_PATH,
}: SnippetLinkParams): string => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null && page !== '') {
    params.set(PAGE_PARAM, String(page));
  }
  if (searchTerm) {
    params.set(SEARCH_PARAM, searchTerm);
  }
  if (filename) {
    params.set('file', filename);
  }
  const query = params.toString();
  return `${legacyBasePath}/${sharedId}/text-search${query ? `?${query}` : ''}`;
};

const buildV2SnippetLink = ({
  sharedId,
  searchTerm,
  page,
  entityViewerV2,
}: SnippetLinkParams): string => {
  const hash = new URLSearchParams();
  hash.set(SIDE_TAB_PARAM, SIDE_TAB.SEARCH);
  if (searchTerm) {
    hash.set(SEARCH_PARAM, searchTerm);
  }
  if (page !== undefined && page !== null && page !== '') {
    hash.set(PAGE_PARAM, String(page));
  }
  return `${getEntityViewerV2Path(sharedId, Boolean(entityViewerV2))}${serializeEntityHash(hash)}`;
};

/**
 * Library / sidepanel snippet deep-link.
 * V2 (flag ON, not inside legacy viewer): /entity/{id}#s=search&searchTerm=…&page=…
 * V1 / legacy viewer: /{entity|legacy-entity}/{id}/text-search?page=…&searchTerm=…&file=…
 */
const buildEntitySnippetLink = (params: SnippetLinkParams): string => {
  const insideLegacyViewer = params.legacyBasePath === LEGACY_ENTITY_PATH;
  if (params.entityViewerV2 && !insideLegacyViewer) {
    return buildV2SnippetLink(params);
  }
  return buildV1SnippetLink(params);
};

/**
 * "View" button from library cards — opens entity, optionally with search side panel in V2.
 */
const buildEntityViewLink = ({
  sharedId,
  searchTerm,
  entityViewerV2,
  refId,
}: {
  sharedId: string;
  searchTerm?: string;
  entityViewerV2?: boolean;
  refId?: string;
}): string => {
  if (entityViewerV2) {
    if (searchTerm) {
      return buildV2SnippetLink({ sharedId, searchTerm, entityViewerV2: true });
    }
    return getEntityViewerV2Path(sharedId, true);
  }

  const params = new URLSearchParams();
  if (searchTerm) {
    params.set(SEARCH_PARAM, searchTerm);
  }
  if (refId) {
    params.set('ref', refId);
  }
  const query = params.toString();
  return `${ENTITY_PATH}/${sharedId}${query ? `?${query}` : ''}`;
};

export {
  ENTITY_PATH,
  ENTITY_V2_PATH,
  LEGACY_ENTITY_PATH,
  isEntityViewerV2Enabled,
  getEntityViewerV2BasePath,
  getEntityViewerV1BasePath,
  getEntityViewerV2Path,
  isLegacyEntityPath,
  isEntityV2Path,
  isEntityPath,
  getV1EntityBasePathFromLocation,
  buildEntitySnippetLink,
  buildEntityViewLink,
};
export type { SnippetLinkParams };
