import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { UpdateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/UpdateRelationshipTypeUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { upsertRelationshipTypeRequestSchema } from './RelationshipTypeRouteSchemas.js';

class UpdateRelationshipTypeController extends AbstractController {
  protected async handle(): Promise<void> {
    const dto = upsertRelationshipTypeRequestSchema.parse(this.request.body);

    if (!dto._id) {
      throw new Error('Relationship type _id is required for update');
    }

    const updated = await UpdateRelationshipTypeUseCaseFactory.default().execute({
      id: dto._id,
      name: dto.name,
    });

    this.response.json(toDTO(updated));
  }
}

export { UpdateRelationshipTypeController };
