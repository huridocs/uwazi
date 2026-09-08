import * as cookie from 'cookie';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UpdateEntityRequest, UpdateEntitySchema } from './Schemas.js';
import { UpdateEntityUseCaseFactory } from '../../factories/UpdateEntityUseCaseFactory.js';
import { ExpressEntityMapper } from './ExpressEntityMapper.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager.js';
import { ATConflictSolver } from '#api/externalIntegrations.v2/automaticTranslation/utils/ATConflictSolver.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';

type Request = UpdateEntityRequest | { entity: string };

class UpdateEntityController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const sessionId = cookie.parse(this.request.get('cookie') || '')['connect.sid'];
    const useCase = UpdateEntityUseCaseFactory.default(undefined, sessionId);
    const entityDAO = EntitiesDAOFactory.default({ user: this.user });

    let parsed: UpdateEntityRequest;

    if ('entity' in this.request.body) {
      parsed = UpdateEntitySchema.parse(JSON.parse(this.request.body.entity));
    } else {
      parsed = UpdateEntitySchema.parse(this.request.body);
    }

    const currentDocs = await entityDAO.getBySharedId(parsed.sharedId);
    const currentDoc = currentDocs.find(d => d.language === parsed.language);
    if (currentDoc) {
      const resolver = new ATConflictSolver(
        AutomaticTranslationFactory.defaultATConfigDataSource(
          ExecutionContext.transactionManager as MongoTransactionManager
        ),
        ExecutionContext.logger
      );
      parsed = await resolver.execute(currentDoc, parsed);

      if ('entity' in this.request.body) {
        this.request.body.entity = JSON.stringify(parsed);
      } else {
        Object.assign(this.request.body, parsed);
      }
    }

    const mapped = ExpressEntityMapper.toEntityUpdateInput({
      dto: parsed,
      inputFiles: this.request.inputFiles,
    });

    const output = await useCase.execute(mapped);

    const [entityWithFiles] = await entityDAO.find(
      { sharedId: output.sharedId, language: this.language },
      { withFiles: true }
    );

    const response =
      'entity' in this.request.body ? { entity: entityWithFiles, errors: [] } : entityWithFiles;

    this.response.json(response);
    this.request.emitToSessionSocket('documentProcessed', output.sharedId);
  }
}

export { UpdateEntityController };
