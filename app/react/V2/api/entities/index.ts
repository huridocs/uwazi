import api from '#app/utils/api.js';
import { IncomingHttpHeaders } from 'http';

import { EntitySchema } from '#shared/types/entityType.js';

import { FetchResponseError } from '#shared/JSONRequest.js';

import { RequestParams } from '#app/utils/RequestParams.js';
import * as formatter from '#V2/api/entities/formatter.js';

const getById = async ({
  _id,
  language,
  omitRelationships = true,
}: {
  _id: string;
  language: string;
  omitRelationships?: boolean;
}): Promise<EntitySchema[]> => {
  try {
    const requestParams = new RequestParams({
      _id,
      omitRelationships,
    });

    api.locale(language);

    const {
      json: { rows: response },
    } = await api.get('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const getBySharedId = async (
  {
    sharedId,
    language,
    omitRelationships = true,
  }: { sharedId: string; language: string; omitRelationships?: boolean },
  headers?: IncomingHttpHeaders
): Promise<EntitySchema[]> => {
  try {
    const requestParams = new RequestParams(
      {
        sharedId,
        omitRelationships,
      },
      headers
    );

    api.locale(language);

    const {
      json: { rows: response },
    } = await api.get('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const save = async (entity: EntitySchema): Promise<EntitySchema | FetchResponseError> => {
  try {
    const requestParams = new RequestParams(entity);
    const { json: response } = await api.post('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

const coerceValue = async (
  value: string | Date,
  type: string,
  locale: string
): Promise<{ success: string; value: number }> => {
  try {
    const requestParams = new RequestParams({
      locale,
      value,
      type,
    });
    const { json: response } = await api.post('entities/coerce_value', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

export { getById, save, coerceValue, formatter, getBySharedId };
