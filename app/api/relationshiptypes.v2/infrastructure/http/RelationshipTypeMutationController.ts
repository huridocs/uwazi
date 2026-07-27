import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateRelationshipTypeUseCaseFactory } from '../factories/CreateRelationshipTypeUseCaseFactory.js';
import { UpdateRelationshipTypeUseCaseFactory } from '../factories/UpdateRelationshipTypeUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { upsertRelationshipTypeRequestSchema } from './RelationshipTypeRouteSchemas.js';

class RelationshipTypeMutationController extends AbstractController {
  protected async handle(): Promise<void> {
    const dto = upsertRelationshipTypeRequestSchema.parse(this.request.body);

    if (!dto._id) {
      const created = await CreateRelationshipTypeUseCaseFactory.default().execute({
        name: dto.name,
      });
      this.response.json(toDTO(created));
      return;
    }

    const updated = await UpdateRelationshipTypeUseCaseFactory.default().execute({
      id: dto._id,
      name: dto.name,
    });
    this.response.json(toDTO(updated));
  }
}

export { RelationshipTypeMutationController };
