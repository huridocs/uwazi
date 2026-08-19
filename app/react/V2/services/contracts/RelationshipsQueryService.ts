import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type {
  RelationshipAnchorRow,
  RelationshipHubRow,
  RelationshipResolvedRow,
} from '#V2/api/relationships/types.js';
import type { RelationshipView } from '#V2/formatters/relationships/types.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type RelationshipQueryReadOptions = ServiceRequestOptions & {
  language: string;
};

type RelationshipAnchorsReadOptions = RelationshipQueryReadOptions & {
  fileId: string;
};

type RelationshipHubOverlays = {
  anchors?: readonly RelationshipAnchorRow[];
  resolved?: readonly RelationshipResolvedRow[];
};

interface RelationshipsQueryService {
  loadSummary(
    sharedId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipHubRow[] | undefined>>;
  loadAnchors(
    sharedId: string,
    options: RelationshipAnchorsReadOptions
  ): Promise<ApiResponse<RelationshipAnchorRow[] | undefined>>;
  loadResolved(
    sharedId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipResolvedRow[] | undefined>>;
  compose(
    hubs: readonly RelationshipHubRow[],
    overlays?: RelationshipHubOverlays
  ): RelationshipHubRow[];
  toViews(sharedId: string, hubs: readonly RelationshipHubRow[]): RelationshipView[];
}

export type {
  RelationshipsQueryService,
  RelationshipQueryReadOptions,
  RelationshipAnchorsReadOptions,
  RelationshipHubOverlays,
};
