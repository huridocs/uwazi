import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { CreateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/CreateRelationshipTypeUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { upsertRelationshipTypeRequestSchema } from './RelationshipTypeRouteSchemas.js';

class CreateRelationshipTypeController extends AbstractController {
  protected async handle(): Promise<void> {
    const dto = upsertRelationshipTypeRequestSchema.parse(this.request.body);

    const created = await CreateRelationshipTypeUseCaseFactory.default().execute({
      name: dto.name,
    });

    this.response.json(toDTO(created));
  }
}

export { CreateRelationshipTypeController };
