import * as cookie from 'cookie';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ATConflictSolver } from '#api/externalIntegrations.v2/automaticTranslation/utils/ATConflictSolver.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { CreateEntitySchema, UpdateEntityRequest, UpdateEntitySchema } from './Schemas.js';
import { CreateEntityUseCaseFactory } from '../../factories/CreateEntityUseCaseFactory.js';
import { UpdateEntityUseCaseFactory } from '../../factories/UpdateEntityUseCaseFactory.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';
import { ExpressEntityMapper } from './ExpressEntityMapper.js';

type Request = Record<string, unknown> | { entity: string };

type ParsedBody = {
  payload: Record<string, unknown>;
  isMultipart: boolean;
};

class MutateEntityController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    const body = this.parseBody();

    if (body.payload.sharedId) {
      return this.update(body);
    }

    return this.create(body);
  }

  private parseBody(): ParsedBody {
    const isMultipart = 'entity' in this.request.body;
    const payload = isMultipart
      ? JSON.parse((this.request.body as { entity: string }).entity)
      : this.request.body;

    return { payload, isMultipart };
  }

  private get sessionId() {
    return cookie.parse(this.request.get('cookie') || '')['connect.sid'];
  }

  private async create({ payload, isMultipart }: ParsedBody) {
    const parsed = CreateEntitySchema.parse(payload);
    const useCase = CreateEntityUseCaseFactory.default({
      targetLanguage: this.language,
      sessionId: this.sessionId,
    });

    const entity = await useCase.execute(
      ExpressEntityMapper.toEntityCreateInput({
        dto: parsed,
        inputFiles: this.request.inputFiles,
      })
    );

    await this.respond(entity.sharedId, isMultipart);
  }

  private async update({ isMultipart, payload }: ParsedBody) {
    const useCase = UpdateEntityUseCaseFactory.default(undefined, this.sessionId);
    const parsed = await this.resolveAutomaticTranslationConflicts(
      UpdateEntitySchema.parse(payload),
      isMultipart
    );

    const entity = await useCase.execute(
      ExpressEntityMapper.toEntityUpdateInput({
        dto: parsed,
        inputFiles: this.request.inputFiles,
      })
    );

    await this.respond(entity.sharedId, isMultipart);
    this.request.emitToSessionSocket('documentProcessed', entity.sharedId);
  }

  private async resolveAutomaticTranslationConflicts(
    parsed: UpdateEntityRequest,
    isMultipart: boolean
  ): Promise<UpdateEntityRequest> {
    const currentDocs = await EntitiesDAOFactory.default({ user: this.user }).getBySharedId(
      parsed.sharedId
    );
    const currentDoc = currentDocs.find(doc => doc.language === parsed.language);
    if (!currentDoc) return parsed;

    const resolver = new ATConflictSolver(
      AutomaticTranslationFactory.defaultATConfigDataSource(ExecutionContext.transactionManager),
      ExecutionContext.logger
    );
    const resolved = await resolver.execute(currentDoc, parsed);

    // Keep the logged request body in sync with what is actually saved.
    if (isMultipart) {
      this.request.body.entity = JSON.stringify(resolved);
    } else {
      Object.assign(this.request.body, resolved);
    }

    return resolved;
  }

  private async respond(sharedId: string, isMultipart: boolean) {
    const [entity] = await EntitiesDAOFactory.default({ user: this.user }).find(
      { sharedId, language: this.language },
      { withFiles: true }
    );

    this.response.json(isMultipart ? { entity, errors: [] } : entity);
  }
}

export { MutateEntityController };
