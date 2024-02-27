import { IncomingHttpHeaders } from 'http';
import { ClientRelationshipType } from 'app/apiResponseTypes';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';

const get = async (headers?: IncomingHttpHeaders): Promise<ClientRelationshipType[]> => {
  const requestParams = new RequestParams({}, headers);
  return api.get('relationtypes', requestParams).then((response: any) => response.json.rows);
};

const save = async (
  relationshipTypes: ClientRelationshipType[]
): Promise<ClientRelationshipType[]> => {
  const allSaved = relationshipTypes.map(async relationshipType => {
    const requestParams = new RequestParams(relationshipType);
    return api.post('relationtypes', requestParams).then((response: any) => response.json);
  });

  return Promise.all(allSaved);
};

export { get, save };
