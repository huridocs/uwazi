import api from 'app/utils/api';
import { EntitySchema } from 'shared/types/entityType';
import { RequestParams } from 'app/utils/RequestParams';

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

const save = async (entity: EntitySchema) => {
  if (entity._id) {
  } else {
  }
};

const coerceValue = async (
  value: string,
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

export { getById, save, coerceValue };
