import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DeleteRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/DeleteRelationshipTypeUseCaseFactory.js';
import { deleteRelationshipTypeQuerySchema } from './RelationshipTypeRouteSchemas.js';

class DeleteRelationshipTypeController extends AbstractController {
  protected async handle(): Promise<void> {
    const parsed = deleteRelationshipTypeQuerySchema.parse(this.request.query);
    const response = await DeleteRelationshipTypeUseCaseFactory.default().execute({
      id: parsed._id,
    });
    this.response.json(response);
  }
}

export { DeleteRelationshipTypeController };
