import type {
  RelationshipType,
  RelationshipTypeInput,
} from '#shared/contracts/RelationshipType.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

/**
 * Relationship types domain service (settings CRUD).
 *
 * Standard reads: `getAll`.
 * Standard writes: `upsert`, `delete`.
 */
interface RelationshipTypesService {
  getAll(options?: ServiceRequestOptions): Promise<ApiResponse<RelationshipType[]>>;
  upsert(
    relationshipType: RelationshipTypeInput,
    options?: ServiceRequestOptions
  ): Promise<ApiResponse<RelationshipType>>;
  delete(ids: string[], options?: ServiceRequestOptions): Promise<ApiResponse<void>>;
}

export type { RelationshipTypesService, RelationshipTypeInput };
