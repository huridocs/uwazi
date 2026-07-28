import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import { toDTO } from './RelationshipTypeMapper.js';
import { getRelationshipTypesQuerySchema } from './RelationshipTypeRouteSchemas.js';

class GetRelationshipTypesController extends AbstractController {
  protected async handle(): Promise<void> {
    const parsed = getRelationshipTypesQuerySchema.parse(this.request.query);
    const response = await GetRelationshipTypesUseCaseFactory.default().execute({
      id: parsed._id,
    });
    this.response.json({ rows: response.map(toDTO) });
  }
}

export { GetRelationshipTypesController };
