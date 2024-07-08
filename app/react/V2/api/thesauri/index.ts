import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { IncomingHttpHeaders } from 'http';
import { httpRequest } from 'shared/superagent';
import { ThesaurusSchema } from 'shared/types/thesaurusType';

export default {
  getThesauri(params: { _id?: string }, headers?: IncomingHttpHeaders) {
    const url = 'dictionaries';
    const requestParams = new RequestParams(params, headers);
    return api.get(url, requestParams).then((response: any) => response.json.rows);
  },

  save(thesaurus: ThesaurusSchema, headers?: IncomingHttpHeaders) {
    const requestParams = new RequestParams(thesaurus, headers);
    return api.post('thesauris', requestParams).then((response: any) => response.json);
  },

  delete(params: { _id: string }, headers?: IncomingHttpHeaders) {
    const requestParams = new RequestParams(params, headers);
    return api.delete('thesauris', requestParams).then((response: any) => response.json);
  },

  async importThesaurus(thesaurus: ThesaurusSchema, file: File) {
    const headers = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    const fields = {
      thesauri: JSON.stringify(thesaurus),
    };
    return httpRequest('thesauris', fields, headers, file);
  },
};
