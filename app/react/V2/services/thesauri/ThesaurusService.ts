import { IncomingHttpHeaders } from 'http';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { apiCall } from '#V2/api/helpers.js';
import * as thesauriApi from '#V2/api/thesauri/index.js';

type ThesaurusInput = Omit<ClientThesaurus, '_id'> & { _id?: string };

interface ThesaurusService {
  list(input: { headers?: IncomingHttpHeaders }): Promise<ApiResponse<ClientThesaurus[]>>;
  getById(input: {
    _id: string;
    headers?: IncomingHttpHeaders;
  }): Promise<ApiResponse<ClientThesaurus | undefined>>;
  save(thesaurus: ThesaurusInput): Promise<ApiResponse<ClientThesaurus>>;
  deleteMany(ids: string[]): Promise<ApiResponse<void, FetchResponseError>>;
}

const createThesaurusService = (): ThesaurusService => ({
  list: ({ headers }) => apiCall(() => thesauriApi.get({}, headers)),

  getById: ({ _id, headers }) =>
    apiCall(async () => {
      const rows = await thesauriApi.get({ _id }, headers);
      return rows[0];
    }),

  save: thesaurus => apiCall(() => thesauriApi.save(thesaurus)),

  deleteMany: ids =>
    apiCall(async () => {
      await Promise.all(ids.map(_id => thesauriApi.deleteThesauri({ _id })));
    }),
});

export type { ThesaurusService, ThesaurusInput };
export { createThesaurusService };
