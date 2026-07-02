import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import * as thesauriApi from '#V2/api/thesauri/index.js';
import type { ThesaurusInput, ThesaurusService } from '../contracts/ThesaurusService.js';

const toApiResponse = async <T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T, FetchResponseError>> => {
  try {
    return [await fn()];
  } catch (e) {
    return [undefined as T, e as FetchResponseError];
  }
};

const createHttpThesaurusService = (): ThesaurusService => ({
  getAll: ({ headers } = {}) => toApiResponse(() => thesauriApi.get({}, headers)),

  getById: (id, { headers } = {}) =>
    toApiResponse(async () => {
      const rows = await thesauriApi.get({ _id: id }, headers);
      return rows[0];
    }),

  upsert: thesaurus => toApiResponse(() => thesauriApi.save(thesaurus)),

  delete: ids =>
    toApiResponse(async () => {
      await Promise.all(ids.map(_id => thesauriApi.deleteThesauri({ _id })));
    }),
});

export { createHttpThesaurusService };
