import type { ApiResponse } from '#V2/api/ApiResponse.js';
import type {
  RelationshipAnchor,
  RelationshipHubRow,
  RelationshipResolved,
} from '#V2/api/relationships/types.js';
import type { DirectedRelationship } from '#V2/formatters/relationships/types.js';
import type { ServiceRequestOptions } from './ServiceRequestOptions.js';

type RelationshipQueryReadOptions = ServiceRequestOptions & {
  language: string;
};

type RelationshipAnchorsReadOptions = RelationshipQueryReadOptions & {
  fileId: string;
};

type RelationshipHubOverlays = {
  anchors?: readonly RelationshipAnchor[];
  resolved?: readonly RelationshipResolved[];
};

interface RelationshipsQueryService {
  loadSummary(
    sharedId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipHubRow[] | undefined>>;
  loadAnchors(
    sharedId: string,
    options: RelationshipAnchorsReadOptions
  ): Promise<ApiResponse<RelationshipAnchor[] | undefined>>;
  loadResolved(
    sharedId: string,
    options: RelationshipQueryReadOptions
  ): Promise<ApiResponse<RelationshipResolved[] | undefined>>;
  compose(
    hubs: readonly RelationshipHubRow[],
    overlays?: RelationshipHubOverlays
  ): RelationshipHubRow[];
  toRelationships(sharedId: string, hubs: readonly RelationshipHubRow[]): DirectedRelationship[];
}

export type {
  RelationshipsQueryService,
  RelationshipQueryReadOptions,
  RelationshipAnchorsReadOptions,
  RelationshipHubOverlays,
};
