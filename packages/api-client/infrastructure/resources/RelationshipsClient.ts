import { GetRelationshipsAnchorsController } from '#api/relationships/query/express/GetRelationshipsAnchorsController.js';
import { GetRelationshipsSummaryController } from '#api/relationships/query/express/GetRelationshipsSummaryController.js';

import type { RelationshipsResource } from '../../application/ServerApiClient.js';
import type {
  RelationshipsAnchorsQuery,
  RelationshipsAnchorsResponse,
  RelationshipsSummaryQuery,
  RelationshipsSummaryResponse,
} from '../../application/contracts/Relationships.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class RelationshipsClient implements RelationshipsResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async getSummary(query: RelationshipsSummaryQuery) {
    return this.invoker.invoke<RelationshipsSummaryResponse>(
      GetRelationshipsSummaryController,
      query
    );
  }

  async getAnchors(query: RelationshipsAnchorsQuery) {
    return this.invoker.invoke<RelationshipsAnchorsResponse>(
      GetRelationshipsAnchorsController,
      query
    );
  }
}

export { RelationshipsClient };
