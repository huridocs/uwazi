import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { EntitySearchService } from '../../elasticSearch/entities/EntitySearchService';

type Request = void;

class GetAllEntitiesController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const service = new EntitySearchService({
      elasticClient: DependenciesContext.authorizedEntityESClient,
    });

    const entities = await service.getAll();

    this.response.json(entities);
  }
}

export { GetAllEntitiesController };

/**
 * 1. Assign next available slot (propertyName, type) => fieldName,type, assignedTo
 * 2. Unassign slot (propertyName)
 * 3. Update property name (propertyName, newPropertyName)
 * 4. Get unsigned slots -> return propertyName, type
 *
 * 4. When indexing entities -> translate (propertyName) => fieldName
 * 5. When searching entities -> translate (propertyName) => fieldName
 *
 * 1. bootstrap (Slots bootstrapper): fresh start, no existing indexes, create new index with alias pointing to it
 */
