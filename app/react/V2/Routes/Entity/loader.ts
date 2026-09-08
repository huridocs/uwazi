import { LoaderFunction } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { getStore } from '#shared/atomStore/index.js';
import { isClient } from '#app/utils/index.js';
import { localeAtom, settingsAtom } from '#app/V2/atoms/index.js';
import { getDocumentPlaintext } from '#V2/api/files/index.js';
import { ApiError } from '#shared/apiClient/index.js';
import type { V2Services } from '#V2/services/types.js';
import { httpServices } from '#V2/services/http/index.js';
import { throwApiError } from '#V2/shared/errorUtils.js';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import { getMainDocument } from '#V2/formatters/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import { entityLoaderCache } from './EntityLoaderCache.js';
import { parseEntityHash } from './entityUrlAtoms.js';
import { MAIN_TAB_PARAM, SIDE_TAB_PARAM, VIEW_MODE_PARAM } from './Components/index.js';
import { MAIN_TAB, isValidMainTab } from './Tabs/tabIds.js';
import { getSideTabButtons } from './Tabs/sideTabSets.js';
import { resolveSideTabId } from './Tabs/entityTabState.js';
import { documentRelationshipRailVisible } from './Tabs/documentRelationshipRail.js';
import { loadEntityPageView } from './loadEntityPageView.js';
import { LoaderResponse } from './types.js';

const entityNotFoundError = (sharedId: string) =>
  new ApiError('Not found', {
    kind: 'http',
    status: 404,
    detail: `Entity ${sharedId} not found`,
  });

type RelationshipQueryInput = {
  sharedId: string;
  language: string;
  fileId?: string;
  headers?: IncomingHttpHeaders;
  requestUrl: string;
  entity: Entity;
};

const seedPayload = ({
  language,
  sharedId,
  fileId,
  hubRows,
  anchorsLoaded,
}: {
  language: string;
  sharedId: string;
  fileId?: string;
  hubRows: RelationshipQueryPayload['hubRows'];
  anchorsLoaded: boolean;
}): RelationshipQueryPayload => ({
  language,
  sharedId,
  ...(fileId ? { fileId } : {}),
  hubRows,
  anchorsLoaded,
});

const requestHash = (requestUrl: string) => {
  const { hash } = new URL(requestUrl);
  if (hash) return hash;
  if (isClient && typeof window !== 'undefined') return window.location.hash;
  return '';
};

const isRawFromRequest = (requestUrl: string) =>
  parseEntityHash(requestHash(requestUrl)).get(VIEW_MODE_PARAM) === 'true';

const needAnchorsForRequest = (requestUrl: string, fileId: string | undefined, entity: Entity) => {
  if (!fileId || isRawFromRequest(requestUrl)) return false;
  const url = new URL(requestUrl);
  const mainFromUrl = url.searchParams.get(MAIN_TAB_PARAM);
  const mainTab = isValidMainTab(mainFromUrl) ? mainFromUrl : MAIN_TAB.DOCUMENT;
  const sideTab = resolveSideTabId(
    parseEntityHash(requestHash(requestUrl)).get(SIDE_TAB_PARAM),
    getSideTabButtons({ activeMainTab: mainTab, entity, hasMainDocument: true })
  );
  return documentRelationshipRailVisible(mainTab, sideTab);
};

const loadSummarySeed = async (
  query: V2Services['relationshipsQuery'],
  input: RelationshipQueryInput
) => {
  const [hubRows, error] = await query.loadSummary(input.sharedId, {
    language: input.language,
    headers: input.headers,
  });
  if (error) throwApiError(error);
  return seedPayload({
    language: input.language,
    sharedId: input.sharedId,
    fileId: input.fileId,
    hubRows: hubRows ?? [],
    anchorsLoaded: false,
  });
};

const loadSummaryAndAnchorsSeed = async (
  query: V2Services['relationshipsQuery'],
  input: RelationshipQueryInput & { fileId: string }
) => {
  const options = { language: input.language, headers: input.headers };
  const [[summary, summaryError], [anchors, anchorsError]] = await Promise.all([
    query.loadSummary(input.sharedId, options),
    query.loadAnchors(input.sharedId, { ...options, fileId: input.fileId }),
  ]);
  if (summaryError) throwApiError(summaryError);
  if (anchorsError) throwApiError(anchorsError);
  return seedPayload({
    language: input.language,
    sharedId: input.sharedId,
    fileId: input.fileId,
    hubRows: query.compose(summary ?? [], { anchors: anchors ?? [] }),
    anchorsLoaded: true,
  });
};

const fetchRelationshipPayload = async (
  services: V2Services,
  input: RelationshipQueryInput,
  needAnchors: boolean
) => {
  if (needAnchors && input.fileId) {
    return loadSummaryAndAnchorsSeed(services.relationshipsQuery, {
      ...input,
      fileId: input.fileId,
    });
  }
  return loadSummarySeed(services.relationshipsQuery, input);
};

const loadRelationshipQuery = async (services: V2Services, input: RelationshipQueryInput) => {
  const needAnchors = Boolean(
    input.fileId && needAnchorsForRequest(input.requestUrl, input.fileId, input.entity)
  );
  const cached = entityLoaderCache.getRelationshipQuery(
    input.sharedId,
    input.language,
    input.fileId,
    { requireAnchors: needAnchors }
  );
  if (cached) {
    return cached;
  }
  const payload = await fetchRelationshipPayload(services, input, needAnchors);
  entityLoaderCache.setRelationshipQuery(input.sharedId, input.language, input.fileId, payload);
  return payload;
};

const loadEntityForRequest = async ({
  services,
  entitySharedId,
  language,
  headers,
}: {
  services: V2Services;
  entitySharedId: string;
  language: string;
  headers?: IncomingHttpHeaders;
}) => {
  const cached = entityLoaderCache.getEntity(entitySharedId, language);
  if (cached?._id) {
    return cached;
  }
  const [fetchedEntity, error] = await services.entities.getBySharedId(entitySharedId, {
    language,
    omitRelationships: true,
    headers,
  });
  if (error) throwApiError(error);
  const [entity] = fetchedEntity ?? [];
  if (!entity?._id) {
    throwApiError(entityNotFoundError(entitySharedId));
  }
  entityLoaderCache.setEntity(entitySharedId, language, entity);
  return entity;
};

const syncMainDocument = (
  entity: Entity,
  language: string,
  defaultLanguage: string | undefined
) => {
  const cached = entityLoaderCache.getMainDocument(entity.sharedId, language);
  const derived = getMainDocument(readyDocuments(entity.documents), language, defaultLanguage);
  if (!derived) {
    entityLoaderCache.clearMainDocument(entity.sharedId, language);
    return undefined;
  }
  if (cached?._id !== derived._id || cached?.originalname !== derived.originalname) {
    entityLoaderCache.setMainDocument(entity.sharedId, language, derived);
  }
  return derived;
};

const loadCachedOrFetchPlaintext = async (fileId: string, headers?: IncomingHttpHeaders) => {
  const cached = entityLoaderCache.getPlaintext(fileId);
  if (cached) {
    return cached;
  }
  const response = await getDocumentPlaintext(fileId, headers);
  if (response instanceof FetchResponseError) {
    throwApiError(
      new ApiError('Failed to load plaintext', {
        kind: 'http',
        status: 404,
        detail: response.message,
      })
    );
    return '';
  }
  entityLoaderCache.setPlaintext(fileId, response);
  return response;
};

const loadPlaintextIfNeeded = async (
  fileId: string,
  isRaw: boolean,
  headers?: IncomingHttpHeaders
) => {
  if (!isRaw && isClient) {
    return '';
  }
  return loadCachedOrFetchPlaintext(fileId, headers);
};

const createEntityLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params, request }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;
    if (!entitySharedId) {
      return undefined;
    }
    const atomStore = getStore();
    const language = params.lang || atomStore.get(localeAtom);
    const defaultLanguage = atomStore.get(settingsAtom)?.languages?.find(l => l.default)?.key;
    const entity = await loadEntityForRequest({
      services,
      entitySharedId,
      language,
      headers,
    });
    const mainDocument = syncMainDocument(entity, language, defaultLanguage);
    const pagePlaintext = mainDocument?._id
      ? await loadPlaintextIfNeeded(mainDocument._id, isRawFromRequest(request.url), headers)
      : '';
    return {
      entity,
      mainDocument,
      pagePlaintext,
      entityPageView: await loadEntityPageView(entity, headers),
      relationshipQuery: await loadRelationshipQuery(services, {
        sharedId: entity.sharedId,
        language,
        fileId: mainDocument?._id,
        headers,
        requestUrl: request.url,
        entity,
      }),
    };
  };

const entityLoader = createEntityLoader(httpServices);

export { createEntityLoader, entityLoader };
