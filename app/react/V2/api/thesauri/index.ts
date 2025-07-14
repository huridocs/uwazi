import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IncomingHttpHeaders } from 'http';
import { httpRequest } from 'shared/superagent';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const getById = async (params: { _id?: string }, headers?: IncomingHttpHeaders) => {
  const url = 'thesauri/getById'; //WIP
  const requestParams = new RequestParams(params, headers);
  return api.get(url, requestParams).then((response: any) => response.json.rows);
};

const save = async (thesaurus: ThesaurusSchema) => {
  const requestParams = new RequestParams(thesaurus);
  return api.post('thesauri', requestParams).then((response: any) => response.json);
};

const remove = async (params: { _id: string }) => {
  const requestParams = new RequestParams(params);
  return api.delete('thesauri', requestParams).then((response: any) => response.json);
};

const importThesaurus = async (thesaurus: ThesaurusSchema, file: File) => {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const fields = {
    thesauri: JSON.stringify(thesaurus),
  };
  return httpRequest('thesauris', fields, headers, file);
};

export { getById, save, remove, importThesaurus };
