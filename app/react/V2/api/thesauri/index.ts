import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IncomingHttpHeaders } from 'http';
import { httpRequest } from 'shared/superagent';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

const get = async (
  params: { _id?: string },
  headers?: IncomingHttpHeaders
): Promise<(ThesaurusSchema & { _id: string })[]> => {
  const requestParams = new RequestParams(params, headers);
  const response = (await api.get('dictionaries', requestParams)) as {
    json: { rows: (ThesaurusSchema & { _id: string })[] };
  };
  return response.json.rows;
};

const save = async (thesaurus: ThesaurusSchema): Promise<ThesaurusSchema & { _id: string }> => {
  const requestParams = new RequestParams(thesaurus);
  const response = (await api.post('thesauris', requestParams)) as {
    json: ThesaurusSchema & { _id: string };
  };
  return response.json;
};

const deleteThesauri = async (params: { _id: string }): Promise<{ ok: boolean }> => {
  const requestParams = new RequestParams(params);
  const response = (await api.delete('thesauris', requestParams)) as { json: { ok: boolean } };
  return response.json;
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

export { get, save, deleteThesauri, importThesaurus };
