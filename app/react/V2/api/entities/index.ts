// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import { FetchResponseError } from 'shared/JSONRequest.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import * as formatter from './formatter';

type EntityApiParams = {
  omitRelationships?: boolean;
};

const getById = async ({
  _id,
  language,
  omitRelationships = true,
}: EntityApiParams & {
  _id: string;
  language: string;
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
  }: EntityApiParams & {
    sharedId: string;
    language: string;
  },
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
