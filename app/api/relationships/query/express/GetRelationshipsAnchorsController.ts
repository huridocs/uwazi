import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';
import { RelationshipsQueryServiceFactory } from '#api/relationships/query/factory/RelationshipsQueryServiceFactory.js';
import type { GetRelationshipsAnchorsResponse } from '#shared/contracts/Relationships.js';
import { AnchorsQuerySchema } from './RelationshipQuerySchemas.js';

class GetRelationshipsAnchorsController extends AbstractController {
  protected async handle(): Promise<void> {
    try {
      const query = AnchorsQuerySchema.parse(this.request.query);
      const rows = await RelationshipsQueryServiceFactory.default().getAnchors({
        ...query,
        language: this.language,
      });
      const response: GetRelationshipsAnchorsResponse = { rows };
      this.response.json(response);
    } catch (error: unknown) {
      if (error instanceof EntityNotFoundError) {
        const response: GetRelationshipsAnchorsResponse = { rows: [] };
        this.response.json(response);
        return;
      }
      throw error;
    }
  }
}

export { GetRelationshipsAnchorsController };
