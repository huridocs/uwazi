import { IncomingHttpHeaders } from 'http';
import { api } from '#app/utils/api.js';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { httpRequest } from '#shared/superagent.js';

const get = async (
  params: { _id?: string },
  headers?: IncomingHttpHeaders
): Promise<ClientThesaurus[]> => {
  const requestParams = new RequestParams(params, headers);
  const response = (await api.get('dictionaries', requestParams)) as {
    json: { rows: ClientThesaurus[] };
  };
  return response.json.rows;
};

const save = async (
  thesaurus: Omit<ClientThesaurus, '_id'> & { _id?: string },
  headers?: IncomingHttpHeaders
): Promise<ClientThesaurus> => {
  const requestParams = new RequestParams(thesaurus, headers);
  const response = (await api.post('thesauris', requestParams)) as {
    json: ClientThesaurus;
  };
  return response.json;
};

const deleteThesauri = async (
  params: { _id: string },
  headers?: IncomingHttpHeaders
): Promise<{ ok: boolean }> => {
  const requestParams = new RequestParams(params, headers);
  const response = (await api.delete('thesauris', requestParams)) as { json: { ok: boolean } };
  return response.json;
};

const importThesaurus = async (
  thesaurus: Omit<ClientThesaurus, '_id'> & { _id?: string },
  file: File
): Promise<ClientThesaurus> => {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const fields = {
    thesauri: JSON.stringify(thesaurus),
  };
  return httpRequest('thesauris', fields, headers, file) as Promise<ClientThesaurus>;
};

export { get, save, deleteThesauri, importThesaurus };
