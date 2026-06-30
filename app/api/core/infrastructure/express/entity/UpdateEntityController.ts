import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UpdateEntityRequest, UpdateEntitySchema } from './Schemas.js';
import { UpdateEntityUseCaseFactory } from '../../factories/UpdateEntityUseCaseFactory.js';
import { ExpressEntityMapper } from './ExpressEntityMapper.js';
import { MongoEntitiesDAOFactory } from '../../factories/MongoEntitiesDAOFactory.js';

type Request = UpdateEntityRequest | { entity: string };

class UpdateEntityController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const startTime = Date.now();
    try {
      const useCase = UpdateEntityUseCaseFactory.default();
      const entityDAO = MongoEntitiesDAOFactory.default({ user: this.user });

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

      const [entityWithFiles] = await entityDAO.getWithFiles({
        sharedId: output.sharedId,
        language: this.language,
      });

      const response =
        'entity' in this.request.body ? { entity: entityWithFiles, errors: [] } : entityWithFiles;

      ExecutionContext.logger.info('Entity Update executed successfully', {
        namespace: 'Entity_Update',
        success: true,
        durationMs: Date.now() - startTime,

        sharedId: output.sharedId,
        templateId: output.template.id.toString(),
      });

      this.response.json(response);
      this.request.emitToSessionSocket('documentProcessed', output.sharedId);
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      ExecutionContext.logger.info(
        `Entity update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          namespace: 'Entity_Update',
          durationMs: duration,
          success: false,
          notify: true,

          error: JSON.stringify(error),
          dto: JSON.stringify(this.request.body),
        }
      );

      throw error;
    }
  }
}

export { UpdateEntityController };
