import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { EntitySchema } from 'shared/types/entityType';

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

export { getById };
