import { IncomingHttpHeaders } from 'http';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (headers?: IncomingHttpHeaders): Promise<ClientRelationshipType[]> => {
  const requestParams = new RequestParams({}, headers);
  return api.get(requestParams);
};

const save = async (
  relationshipTypes: ClientRelationshipType[]
): Promise<ClientRelationshipType[]> => {
  const requestParams = new RequestParams(relationshipTypes);
  return api.post('relationtypes', requestParams);
};

export { get, save };
