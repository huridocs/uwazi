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
import { parseEntityHash } from './entityUrlState.js';
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

  const query = services.relationshipsQuery;
  let payload: RelationshipQueryPayload;
  if (needAnchors && input.fileId) {
    payload = await loadSummaryAndAnchorsSeed(query, { ...input, fileId: input.fileId });
  } else {
    payload = await loadSummarySeed(query, input);
  }

  entityLoaderCache.setRelationshipQuery(input.sharedId, input.language, input.fileId, payload);
  return payload;
};

const createEntityLoader =
  (services: V2Services) =>
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  // eslint-disable-next-line max-statements
  async ({ params, request }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;
    const atomStore = getStore();
    const language = params.lang || atomStore.get(localeAtom);
    const defaultLanguage = atomStore.get(settingsAtom)?.languages?.find(l => l.default)?.key;
    const isRaw = isRawFromRequest(request.url);

    if (!entitySharedId) {
      return undefined;
    }

    let entity = entityLoaderCache.getEntity(entitySharedId, language);
    let pagePlaintext: string | undefined = '';

    if (!entity?._id) {
      const [fetchedEntity, error] = await services.entities.getBySharedId(entitySharedId, {
        language,
        omitRelationships: true,
        headers,
      });

      if (error) throwApiError(error);

      if (!fetchedEntity?.[0]?._id) {
        throwApiError(entityNotFoundError(entitySharedId));
      }

      entity = fetchedEntity?.[0]!;
      entityLoaderCache.setEntity(entitySharedId, language, entity);
    }

    let mainDocument = entityLoaderCache.getMainDocument(entitySharedId, language);
    if (entity?.sharedId) {
      const derivedMainDocument = getMainDocument(
        readyDocuments(entity.documents),
        language,
        defaultLanguage
      );
      if (derivedMainDocument) {
        if (
          mainDocument?._id !== derivedMainDocument._id ||
          mainDocument?.originalname !== derivedMainDocument.originalname
        ) {
          entityLoaderCache.setMainDocument(entity.sharedId, language, derivedMainDocument);
        }
        mainDocument = derivedMainDocument;
      } else {
        entityLoaderCache.clearMainDocument(entity.sharedId, language);
        mainDocument = undefined;
      }
    }

    if (mainDocument?._id && (isRaw || !isClient)) {
      pagePlaintext = entityLoaderCache.getPlaintext(mainDocument._id);

      if (!pagePlaintext) {
        const response = await getDocumentPlaintext(mainDocument._id, headers);

        if (response instanceof FetchResponseError) {
          throwApiError(
            new ApiError('Failed to load plaintext', {
              kind: 'http',
              status: 404,
              detail: response.message,
            })
          );
        } else {
          pagePlaintext = response;
          entityLoaderCache.setPlaintext(mainDocument._id, pagePlaintext);
        }
      }
    }

    const entityPageView = entity ? await loadEntityPageView(entity, headers) : undefined;
    const relationshipQuery = await loadRelationshipQuery(services, {
      sharedId: entity.sharedId,
      language,
      fileId: mainDocument?._id,
      headers,
      requestUrl: request.url,
      entity,
    });

    return { entity, mainDocument, pagePlaintext, entityPageView, relationshipQuery };
  };

const entityLoader = createEntityLoader(httpServices);

export { createEntityLoader, entityLoader };
