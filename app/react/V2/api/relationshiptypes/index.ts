import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';

type RelationshipType = {
  name: string;
  _id: string;
};

type ClientRelationshipType = {
  _id?: string;
  name: string;
};

const get = async (headers?: IncomingHttpHeaders): Promise<RelationshipType[]> => {
  const requestParams = new RequestParams({}, headers);
  return api.get('relationtypes', requestParams).then((response: any) => response.json.rows);
};

const save = async (relationshipType: ClientRelationshipType): Promise<RelationshipType> => {
  const requestParams = new RequestParams(relationshipType);
  return api.post('relationtypes', requestParams).then((response: any) => response.json);
};

const deleteRelationtypes = async (ids: string[]): Promise<boolean[]> => {
  const allDeleted = ids.map(async id => {
    const requestParams = new RequestParams({ _id: id });
    return api.delete('relationtypes', requestParams).then((response: any) => response.json);
  });

  return Promise.all(allDeleted);
};

const relationshipTypeBeingUsed = async (relationtypeId: string) => {
  const requestParams = new RequestParams({ relationtypeId });
  return api
    .get('references/count_by_relationtype', requestParams)
    .then((response: any) => response.json > 0);
};

export { get, save, deleteRelationtypes, relationshipTypeBeingUsed };
