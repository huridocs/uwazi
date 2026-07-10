import type { Thesaurus, ThesaurusInput } from '#shared/contracts/Thesaurus.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

/**
 * Thesaurus domain service.
 *
 * Standard reads: `getAll`, `getById`.
 * Standard writes: `upsert`, `delete`.
 */
interface ThesaurusService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<Thesaurus[]>>;
  getById(id: string, options?: ServiceRequestOptions): Promise<ApiResponse<Thesaurus | undefined>>;
  upsert(
    thesaurus: ThesaurusInput,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<Thesaurus>>;
  delete(ids: string[], options?: ServiceRequestOptions): Promise<ApiResponse<void>>;
}

export type { ThesaurusService, ThesaurusInput };
