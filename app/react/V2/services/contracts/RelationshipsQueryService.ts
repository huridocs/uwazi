import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type {
  RelationshipAnchorRow,
  RelationshipResolvedRow,
  RelationshipSummaryRow,
} from '#V2/api/relationships/types.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type RelationshipQueryReadOptions = ServiceRequestOptions & {
  language: string;
};

interface RelationshipsQueryService {
  getSummary(
    sharedId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipSummaryRow[] | undefined>>;
  getAnchors(
    sharedId: string,
    fileId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipAnchorRow[] | undefined>>;
  getResolved(
    sharedId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipResolvedRow[] | undefined>>;
}

export type { RelationshipsQueryService, RelationshipQueryReadOptions };
