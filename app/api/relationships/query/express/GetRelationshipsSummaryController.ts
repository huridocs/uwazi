import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';
import { RelationshipsQueryServiceFactory } from '#api/relationships/query/factory/RelationshipsQueryServiceFactory.js';
import type { GetRelationshipsSummaryResponse } from '#shared/contracts/Relationships.js';
import { SharedIdQuerySchema } from './RelationshipQuerySchemas.js';

class GetRelationshipsSummaryController extends AbstractController {
  protected async handle(): Promise<void> {
    try {
      const query = SharedIdQuerySchema.parse(this.request.query);
      const rows = await RelationshipsQueryServiceFactory.default().getSummary({
        ...query,
        language: this.language,
      });
      const response: GetRelationshipsSummaryResponse = { rows };
      this.response.json(response);
    } catch (error: unknown) {
      if (error instanceof EntityNotFoundError) {
        const response: GetRelationshipsSummaryResponse = { rows: [] };
        this.response.json(response);
        return;
      }
      throw error;
    }
  }
}

export { GetRelationshipsSummaryController };
