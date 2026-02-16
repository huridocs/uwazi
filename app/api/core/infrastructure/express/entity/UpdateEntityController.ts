import { AbstractController } from 'api/common.v2/infrastructure/AbstractController';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { UpdateEntityRequest, UpdateEntitySchema } from './Schemas';
import { UpdateEntityUseCaseFactory } from '../../factories/UpdateEntityUseCaseFactory';
import { ExpressEntityMapper } from './ExpressEntityMapper';
import { getConnection } from '../../mongodb/common/getConnectionForCurrentTenant';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager';

type Request = UpdateEntityRequest | { entity: string };

class UpdateEntityController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    try {
      const useCase = UpdateEntityUseCaseFactory.default();
      const entityDAO = new MongoEntityDAO(
        getConnection(),
        DependenciesContext.transactionManager as MongoTransactionManager
      );

      let parsed: UpdateEntityRequest;

      if ('entity' in this.request.body) {
        parsed = UpdateEntitySchema.parse(JSON.parse(this.request.body.entity));
      } else {
        parsed = UpdateEntitySchema.parse(this.request.body);
      }

      const mapped = ExpressEntityMapper.toEntityUpdateInput({
        dto: parsed,
        inputFiles: this.request.inputFiles,
      });

      const output = await useCase.execute(mapped);

      const entityWithFiles = await entityDAO
        .getWithFile({
          sharedId: output.sharedId,
          language: this.language,
        })
        .next();

      const response =
        'entity' in this.request.body ? { entity: entityWithFiles, errors: [] } : entityWithFiles;

      DependenciesContext.getTelemetryCollector()?.add({
        sharedId: output.sharedId,
        templateId: output.template.id.toString(),
      });

      this.response.json(response);
      this.request.emitToSessionSocket('documentProcessed', output.sharedId);
    } catch (error: unknown) {
      DependenciesContext.getTelemetryCollector()?.add({
        error: JSON.stringify(error),
        dto: JSON.stringify(this.request.body),
      });

      throw error;
    }
  }
}

export { UpdateEntityController };
