import type { Thesaurus, ThesaurusInput } from '#shared/contracts/Thesaurus.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
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
  upsert(thesaurus: ThesaurusInput): Promise<ApiResponse<Thesaurus>>;
  delete(ids: string[]): Promise<ApiResponse<void, FetchResponseError>>;
}

export type { ThesaurusService, ThesaurusInput };
