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
import { apiErrorToRequestError } from '#V2/shared/errorUtils.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { entityLoaderCache } from './EntityLoaderCache.js';
import { parseEntityHash } from './entityUrlState.js';
import { VIEW_MODE_PARAM } from './Components/index.js';
import { loadEntityPageView } from './loadEntityPageView.js';
import { LoaderResponse } from './types.js';

const entityNotFoundError = (sharedId: string) =>
  new ApiError('Not found', {
    kind: 'http',
    status: 404,
    detail: `Entity ${sharedId} not found`,
  });

const isRawFromRequest = (requestUrl: string) => {
  const { hash } = new URL(requestUrl);
  if (parseEntityHash(hash).get(VIEW_MODE_PARAM) === 'true') {
    return true;
  }
  if (isClient && typeof window !== 'undefined') {
    return parseEntityHash(window.location.hash).get(VIEW_MODE_PARAM) === 'true';
  }
  return false;
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

    let entity = entityLoaderCache.getEntity(entitySharedId, language, {
      requireRelationships: true,
    });
    let pagePlaintext: string | undefined = '';

    if (!entity?._id) {
      const [fetchedEntity, error] = await services.entities.getBySharedId(entitySharedId, {
        language,
        omitRelationships: false,
        headers,
      });

      if (error) throw apiErrorToRequestError(error);

      if (!fetchedEntity?.[0]?._id) {
        throw apiErrorToRequestError(entityNotFoundError(entitySharedId));
      }

      [entity] = fetchedEntity;
      entityLoaderCache.setEntity(entitySharedId, language, entity);
    }

    let mainDocument = entityLoaderCache.getMainDocument(entitySharedId, language);
    if (entity?.sharedId) {
      const derivedMainDocument = getMainDocument(entity.documents, language, defaultLanguage);
      if (derivedMainDocument) {
        if (mainDocument?._id !== derivedMainDocument._id) {
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
          throw new Response(
            JSON.stringify({
              error: 'Failed to load plaintext',
              message: response.message,
              entityId: entitySharedId,
            }),
            {
              status: 404,
              statusText: 'Failed to load plaintext',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
        } else {
          pagePlaintext = response;
          entityLoaderCache.setPlaintext(mainDocument._id, pagePlaintext);
        }
      }
    }

    const entityPageView = entity ? await loadEntityPageView(entity, headers) : undefined;

    return { entity, mainDocument, pagePlaintext, entityPageView };
  };

const entityLoader = createEntityLoader(httpServices);

export { createEntityLoader, entityLoader };
