import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import type { Thesaurus } from '#shared/contracts/Thesaurus.js';
import { toApiError } from '#shared/apiClient/index.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ThesaurusService } from '../contracts/ThesaurusService.js';
import type { ServiceRequestOptions } from '../contracts/ServiceRequestOptions.js';
import { httpThesaurusService } from '../http/HttpThesaurusService.js';
import type { ServerServiceContext } from './types.js';
import { serializeThesauriRows } from './serializeThesauriRows.js';

const createServerThesaurusService = (ctx: ServerServiceContext): ThesaurusService => ({
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

  upsert: async (thesaurus, options) =>
    httpThesaurusService.upsert(thesaurus, options ?? { headers: ctx.headers }),

  delete: async (ids, options) =>
    httpThesaurusService.delete(ids, options ?? { headers: ctx.headers }),

  importFromFile: async (thesaurus, file, options) =>
    httpThesaurusService.importFromFile(thesaurus, file, options),
});

export { createServerThesaurusService };
