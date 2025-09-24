// @ts-expect-error TS(2307): Cannot find module '../../utils/api.js' or its cor... Remove this comment to see the full error message
import api from '../../utils/api.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientThesaurus } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
import { IncomingHttpHeaders } from 'http';
// @ts-expect-error TS(2307): Cannot find module '../../shared/superagent.js' or... Remove this comment to see the full error message
import { httpRequest } from 'shared/superagent.js';

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
  thesaurus: Omit<ClientThesaurus, '_id'> & { _id?: string }
): Promise<ClientThesaurus> => {
  const requestParams = new RequestParams(thesaurus);
  const response = (await api.post('thesauris', requestParams)) as {
    json: ClientThesaurus;
  };
  return response.json;
};

const deleteThesauri = async (params: { _id: string }): Promise<{ ok: boolean }> => {
  const requestParams = new RequestParams(params);
  const response = (await api.delete('thesauris', requestParams)) as { json: { ok: boolean } };
  return response.json;
};

const importThesaurus = async (
  thesaurus: Omit<ClientThesaurus, '_id'> & { _id?: string },
  file: File
) => {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const fields = {
    thesauri: JSON.stringify(thesaurus),
  };
  return httpRequest('thesauris', fields, headers, file);
};

export { get, save, deleteThesauri, importThesaurus };
