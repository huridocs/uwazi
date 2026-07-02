import { ClientThesaurus } from '#app/apiResponseTypes.js';
import { ApiResponse } from '#V2/api/ApiResponse.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type ThesaurusInput = Omit<ClientThesaurus, '_id'> & { _id?: string };

/**
 * Thesaurus domain service.
 *
 * Naming convention (shared across V2 services):
 * - getAll / getById — reads
 * - upsert — create or update
 * - delete — remove one or many
 */
interface ThesaurusService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<ClientThesaurus[]>>;
  getById(
    id: string,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<ClientThesaurus | undefined>>;
  upsert(thesaurus: ThesaurusInput): Promise<ApiResponse<ClientThesaurus>>;
  delete(ids: string[]): Promise<ApiResponse<void, FetchResponseError>>;
}

export type { ThesaurusService, ThesaurusInput };
