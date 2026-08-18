import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { RelationshipsQueryServiceFactory } from '#api/core/infrastructure/factories/RelationshipsQueryServiceFactory.js';
import { AnchorsQuerySchema } from './RelationshipQuerySchemas.js';
import { sendNotFoundRows } from './sendNotFoundRows.js';

class GetRelationshipsAnchorsController extends AbstractController {
  protected async handle(): Promise<void> {
    try {
      const query = AnchorsQuerySchema.parse(this.request.query);
      const rows = await RelationshipsQueryServiceFactory.default(this.user).getAnchors({
        ...query,
        language: this.language,
      });
      this.response.json({ rows });
    } catch (error: unknown) {
      sendNotFoundRows(this.response, error);
    }
  }
}

export { GetRelationshipsAnchorsController };
