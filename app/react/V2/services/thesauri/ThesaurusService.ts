import { IncomingHttpHeaders } from 'http';
import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
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

const toApiResponse = async <T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T, FetchResponseError>> => {
  try {
    return [await fn()];
  } catch (e) {
    return [undefined as T, e as FetchResponseError];
  }
};

const createThesaurusService = (): ThesaurusService => ({
  list: ({ headers }) => toApiResponse(() => thesauriApi.get({}, headers)),

  getById: ({ _id, headers }) =>
    toApiResponse(async () => {
      const rows = await thesauriApi.get({ _id }, headers);
      return rows[0];
    }),

  save: thesaurus => toApiResponse(() => thesauriApi.save(thesaurus)),

  deleteMany: ids =>
    toApiResponse(async () => {
      await Promise.all(ids.map(_id => thesauriApi.deleteThesauri({ _id })));
    }),
});

export type { ThesaurusService, ThesaurusInput };
export { createThesaurusService };
