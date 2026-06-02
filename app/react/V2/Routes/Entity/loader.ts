import { LoaderFunction } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { getStore } from '#shared/atomStore/index.js';
import { isClient } from '#app/utils/index.js';
import { localeAtom, settingsAtom } from '#app/V2/atoms/index.js';
import { getPagePlaintext } from '#V2/api/files/index.js';
import { snippets } from '#V2/api/search/index.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';
import { getBySharedId } from '#V2/api/entities/index.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { entityLoaderCache } from './EntityLoaderCache.js';
import { PAGE_PARAM, SEARCH_PARAM, VIEW_MODE_PARAM } from './Components/index.js';
import { LoaderResponse } from './types.js';

const entityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  // eslint-disable-next-line max-statements
  async ({ params, request }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;
    const atomStore = getStore();
    const language = params.lang || atomStore.get(localeAtom);
    const defaultLanguage = atomStore.get(settingsAtom)?.languages?.find(l => l.default)?.key;
    const { searchParams } = new URL(request.url);
    const currentPage = searchParams.get(PAGE_PARAM) || '1';
    const currentSearchTerm = searchParams.get(SEARCH_PARAM);
    const isRaw = searchParams.get(VIEW_MODE_PARAM) === 'true';

    if (!entitySharedId) {
      return undefined;
    }

    let entity = entityLoaderCache.getEntity(entitySharedId, language);
    let mainDocument = entityLoaderCache.getMainDocument(entitySharedId, language);
    let pagePlaintext: string | undefined = '';
    let searchResults: SnippetsSearchResponse | undefined;

    if (!entity?._id) {
      const [fetchedEntity, error] = await getBySharedId(
        {
          sharedId: entitySharedId,
          language,
          omitRelationships: false,
        },
        headers
      );

      if (error || !fetchedEntity?.[0]?._id) {
        entity = undefined;
      } else {
        [entity] = fetchedEntity;
        entityLoaderCache.setEntity(entitySharedId, language, entity!);
      }
    }

    if (!mainDocument && entity?.sharedId) {
      mainDocument = getMainDocument(entity.documents, language, defaultLanguage);
      if (mainDocument) {
        entityLoaderCache.setMainDocument(entity.sharedId, language, mainDocument);
      }
    }

    if (mainDocument?._id && (isRaw || !isClient)) {
      pagePlaintext = entityLoaderCache.getPlaintext(mainDocument._id, Number(currentPage));

      if (!pagePlaintext) {
        const response = await getPagePlaintext(
          mainDocument._id,
          Number.parseInt(currentPage, 10),
          headers
        );

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
          entityLoaderCache.setPlaintext(mainDocument._id, Number(currentPage), pagePlaintext);
        }
      }
    }

    if (currentSearchTerm && entity?.sharedId) {
      searchResults = entityLoaderCache.getSearchResults(
        entity.sharedId,
        language,
        currentSearchTerm
      );

      if (!searchResults) {
        searchResults = await snippets(
          {
            sharedId: entity.sharedId,
            limit: 0,
            searchString: currentSearchTerm,
          },
          headers
        );

        entityLoaderCache.setSearchResults(
          entity.sharedId,
          language,
          currentSearchTerm,
          searchResults
        );
      }
    }

    return { entity, mainDocument, pagePlaintext, searchResults };
  };

export { entityLoader };
