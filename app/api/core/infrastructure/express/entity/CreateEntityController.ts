import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { updateThesauriWithEntity } from 'api/entities/routes';
import { CreateEntityDTO } from './Schemas';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager';
import { EntityFacade } from '../../facades/EntitiesFacade';

type RequestDto = CreateEntityDTO | { entity: string };

class CreateEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    let dto: CreateEntityDTO;
    const hasEntityWrapper = 'entity' in this.request.body;

    if (hasEntityWrapper) {
      dto = JSON.parse((this.request.body as { entity: string }).entity);
    } else {
      dto = this.request.body as CreateEntityDTO;
    }

    const entityDAO = new MongoEntityDAO(
      getConnection(),
      DependenciesContext.transactionManager as MongoTransactionManager
    );

    const result = await EntityFacade.create(dto, this.request.inputFiles);

    const entityInTargetLanguage = await entityDAO
      .getWithFile({ language: this.language, sharedId: result.sharedId })
      .next();

    await updateThesauriWithEntity(entityInTargetLanguage, this.request);

    // Return in the same format as V1 for client compatibility
    const response = hasEntityWrapper
      ? { entity: entityInTargetLanguage, errors: [] }
      : entityInTargetLanguage;

    this.response.json(response);
  }
}

export { CreateEntityController };
export type { RequestDto as CreateEntityRequestDto };
