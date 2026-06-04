import { LoaderFunction } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { getStore } from '#shared/atomStore/index.js';
import type { FetchResponseError } from '#shared/JSONRequest.js';
import type { Entity } from '#V2/api/entities/types.js';
import { getBySharedId } from '#V2/api/entities/index.js';
import { localeAtom } from '#app/V2/atoms/index.js';
import type { LoaderResponse } from './types.js';

const editEntityLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  // eslint-disable-next-line max-statements
  async ({ params }): Promise<LoaderResponse> => {
    const entitySharedId = params.sharedId;

    if (!entitySharedId) {
      return undefined;
    }

    const atomStore = getStore();
    const language = params.lang || atomStore.get(localeAtom);

    let entity: Entity | undefined;
    let fetchError: FetchResponseError | undefined;

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
      fetchError = error;
    } else {
      [entity] = fetchedEntity;
    }

    return { entity, error: fetchError };
  };

export { editEntityLoader };
