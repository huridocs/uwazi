import { IncomingHttpHeaders } from 'http';
import { FetchResponseError } from 'shared/JSONRequest';
import { LoaderFunction } from 'react-router';
import { isClient } from 'app/utils';
import { getPagePlaintext } from 'V2/api/files';
import { snippets } from 'V2/api/search';
import { SnippetsSearchResponse } from 'V2/api/types';
import { getEntityCompositionUseCase } from 'V2/application/container/singletons';
import { fullDetailOptions } from 'V2/application/optionsPresets';
import { entityLoaderCache } from './EntityLoaderCache';
import { PAGE_PARAM, SEARCH_PARAM, VIEW_MODE_PARAM } from './Components';
import { LoaderResponse } from './types';

const entityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  // eslint-disable-next-line max-statements
  async ({ params, request }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;
    //LANGUAGE DEFINITION HERE CANNOT DEFAULT TO 'en'
    const language = params.lang || 'en';
    const { searchParams } = new URL(request.url);
    const currentPage = searchParams.get(PAGE_PARAM) || '1';
    const currentSearchTerm = searchParams.get(SEARCH_PARAM);
    const isRaw = searchParams.get(VIEW_MODE_PARAM) === 'true';

    if (!entitySharedId) {
      return undefined;
    }

    let entity = entityLoaderCache.getEntity(entitySharedId, language);
    let pagePlaintext: string | undefined = '';
    let searchResults: SnippetsSearchResponse | undefined;

    if (!entity?._id) {
      const entityCompositionUseCase = await getEntityCompositionUseCase();

      const composition = await entityCompositionUseCase.composeEntity(
        entitySharedId,
        fullDetailOptions,
        {
          headers,
        }
      );

      if (!composition.success || !composition.entity) {
        throw new Response(
          JSON.stringify({
            error: 'Failed to load entity',
            message: composition.error || 'Entity not found',
            entityId: entitySharedId,
          }),
          {
            status: 404,
            statusText: 'Entity Not Found',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      entity = composition.entity;
      entityLoaderCache.setEntity(entitySharedId, language, entity);
    }

    if (entity.mainDocument?.[0]._id && (isRaw || !isClient)) {
      pagePlaintext = entityLoaderCache.getPlaintext(
        entity.mainDocument[0]._id as string,
        Number(currentPage)
      );

      if (!pagePlaintext) {
        const response = await getPagePlaintext(
          entity.mainDocument[0]._id as string,
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
          entityLoaderCache.setPlaintext(
            entity.mainDocument[0]._id as string,
            Number(currentPage),
            pagePlaintext
          );
        }
      }
    }

    if (currentSearchTerm && entity.sharedId) {
      searchResults = entityLoaderCache.getSearchResults(
        entity.sharedId,
        language,
        currentSearchTerm
      );

      if (!searchResults) {
        searchResults = await snippets({
          sharedId: entity.sharedId,
          limit: 0,
          searchString: currentSearchTerm,
        });

        entityLoaderCache.setSearchResults(
          entity.sharedId,
          language,
          currentSearchTerm,
          searchResults
        );
      }
    }

    return { entity, pagePlaintext, searchResults };
  };

export { entityLoader };
