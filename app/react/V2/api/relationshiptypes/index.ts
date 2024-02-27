import { IncomingHttpHeaders } from 'http';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (headers?: IncomingHttpHeaders): Promise<ClientRelationshipType[]> => {
  const requestParams = new RequestParams({}, headers);
  return api.get('relationtypes', requestParams).then((response: any) => response.json.rows);
};

const save = async (relationshipType: ClientRelationshipType): Promise<ClientRelationshipType> => {
  const requestParams = new RequestParams(relationshipType);
  return api.post('relationtypes', requestParams).then((response: any) => response.json);
};

const deleteRelationtypes = async (ids: string[]) => {
  const allDeleted = ids.map(async id => {
    const requestParams = new RequestParams({ _id: id });
    return api.delete('relationtypes', requestParams).then((response: any) => response.json);
  });

  return Promise.all(allDeleted);
};

export { get, save, deleteRelationtypes };
