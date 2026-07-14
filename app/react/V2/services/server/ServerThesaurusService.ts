import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import type { Thesaurus } from '#shared/contracts/Thesaurus.js';
import { ApiError } from '#shared/apiClient/ApiError.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ThesaurusService } from '../contracts/ThesaurusService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import type { ServerServiceContext } from './types.js';

/** Mongo ObjectIds → strings, matching HTTP JSON serialization. */
const serializeThesauriRows = (rows: unknown[]): Thesaurus[] => JSON.parse(JSON.stringify(rows));

const notImplemented = <T>(): ApiResponse<T> => [
  undefined as never,
  new ApiError('ThesaurusService: not implemented on server', {
    kind: 'http',
    status: 501,
    code: 'NOT_IMPLEMENTED',
  }),
];

const createServerThesaurusService = (_ctx: ServerServiceContext): ThesaurusService => ({
  getAll: async (_options?: ServiceRequestOptions): Promise<ApiResponse<Thesaurus[]>> => {
    try {
      const rows = await ThesauriDAOFactory.default().get();
      return [serializeThesauriRows(rows), undefined];
    } catch (e) {
      return [undefined as never, toApiError(e)];
    }
  },

  getById: async (
    id: string,
    _options?: ServiceRequestOptions
  ): Promise<ApiResponse<Thesaurus | undefined>> => {
    try {
      const rows = await ThesauriDAOFactory.default().get([id]);
      const [serialized] = serializeThesauriRows(rows);
      return [serialized, undefined];
    } catch (e) {
      return [undefined, toApiError(e)];
    }
  },

  upsert: async () => notImplemented<Thesaurus>(),

  delete: async () => notImplemented<void>(),

  importFromFile: async () => notImplemented<Thesaurus>(),
});

export { createServerThesaurusService };
