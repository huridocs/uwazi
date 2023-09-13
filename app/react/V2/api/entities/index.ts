import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { EntitySchema } from 'shared/types/entityType';

const getById = async (_id: string): Promise<EntitySchema[]> => {
  try {
    const requestParams = new RequestParams({ _id, omitRelationships: true });
    const { json: response } = await api.get('entities', requestParams);
    return response;
  } catch (e) {
    return e;
  }
};

export { getById };
