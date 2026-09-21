import * as cookie from 'cookie';
import { ValidationError as AJVValidationError } from 'ajv';
import { ZodError } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ATConflictSolver } from '#api/externalIntegrations.v2/automaticTranslation/utils/ATConflictSolver.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import {
  CreateEntitySchema,
  CreateEntityWithTranslationsSchema,
  EntityTranslationsRequest,
  UpdateEntityRequest,
  UpdateEntitySchema,
  UpdateEntityWithTranslationsSchema,
} from './Schemas.js';
import {
  MissingTranslatedPropertyError,
  PropertyNotTranslatableError,
  RequiredTranslatedPropertyError,
} from '#api/core/domain/entity/errors.js';
import {
  MissingTranslationLanguageError,
  TargetLanguageInTranslationsError,
  UnknownTranslationLanguageError,
} from '#api/core/application/errors.js';
import { CreateEntityUseCaseFactory } from '../../factories/CreateEntityUseCaseFactory.js';
import { UpdateEntityUseCaseFactory } from '../../factories/UpdateEntityUseCaseFactory.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';
import { EntitiesQueryServiceFactory } from '../../factories/EntitiesQueryServiceFactory.js';
import { ExpressEntityMapper } from './ExpressEntityMapper.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type Request = Record<string, unknown> | { entity: string };

type ParsedBody = {
  payload: Record<string, unknown>;
  isMultipart: boolean;
};

class MutateEntityController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    try {
      await this.mutate(this.parseBody());
    } catch (error) {
      if (error instanceof ZodError) throw MutateEntityController.withSlashPaths(error);
      throw error;
    }
  }

  private async mutate(body: ParsedBody) {
    if ('translations' in body.payload) {
      return body.payload.sharedId
        ? this.updateWithTranslations(body)
        : this.createWithTranslations(body);
    }

    if (body.payload.sharedId) {
      return this.update(body);
    }

    return this.create(body);
  }

  // Same format as the translation errors (`/translations/<lang>/<property>`).
  private static withSlashPaths(error: ZodError) {
    const converted = new AJVValidationError(
      error.errors.map(issue => ({
        instancePath: `/${issue.path.join('/')}`,
        message: issue.message,
      }))
    );
    converted.message = error.message;
    return converted;
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

  // Body language takes precedence over the content-language header.
  private resolveTargetLanguage(parsed: { language?: string }) {
    return (parsed.language as LanguageISO6391 | undefined) ?? this.language;
  }

  private async create({ payload, isMultipart }: ParsedBody) {
    const parsed = CreateEntitySchema.parse(payload);
    const targetLanguage = this.resolveTargetLanguage(parsed);
    const useCase = CreateEntityUseCaseFactory.default({
      targetLanguage,
      sessionId: this.sessionId,
    });

    const entity = await useCase.execute(
      ExpressEntityMapper.toEntityCreateInput({
        dto: parsed,
        inputFiles: this.request.inputFiles,
      })
    );

    await this.respond(entity.sharedId, isMultipart, targetLanguage);
  }

  private async update({ isMultipart, payload }: ParsedBody) {
    const useCase = UpdateEntityUseCaseFactory.default(undefined, this.sessionId);
    const { target: parsed } = await this.resolveAutomaticTranslationConflicts(
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

  private async createWithTranslations({ payload, isMultipart }: ParsedBody) {
    const parsed = CreateEntityWithTranslationsSchema.parse(payload);
    const targetLanguage = this.resolveTargetLanguage(parsed);
    const useCase = CreateEntityUseCaseFactory.default({
      targetLanguage,
      sessionId: this.sessionId,
    });

    const entity = await MutateEntityController.withTranslationErrorPaths(async () =>
      useCase.execute({
        ...ExpressEntityMapper.toEntityCreateInput({
          dto: parsed,
          inputFiles: this.request.inputFiles,
        }),
        translations: ExpressEntityMapper.toTranslationsInput(parsed.translations),
      })
    );

    await this.respondWithTranslations(entity.sharedId, isMultipart, targetLanguage);
  }

  private async updateWithTranslations({ payload, isMultipart }: ParsedBody) {
    const useCase = UpdateEntityUseCaseFactory.default(undefined, this.sessionId);
    const { translations: sentTranslations, ...sentTarget } =
      UpdateEntityWithTranslationsSchema.parse(payload);
    const { target: parsed, translations } = await this.resolveAutomaticTranslationConflicts(
      sentTarget,
      isMultipart,
      sentTranslations
    );

    const entity = await MutateEntityController.withTranslationErrorPaths(async () =>
      useCase.execute({
        ...ExpressEntityMapper.toEntityUpdateInput({
          dto: parsed,
          inputFiles: this.request.inputFiles,
        }),
        translations: ExpressEntityMapper.toTranslationsInput(translations!),
      })
    );

    await this.respondWithTranslations(entity.sharedId, isMultipart);
    this.request.emitToSessionSocket('documentProcessed', entity.sharedId);
  }

  private static async withTranslationErrorPaths<T>(execute: () => Promise<T>): Promise<T> {
    try {
      return await execute();
    } catch (error) {
      const instancePath = MutateEntityController.translationErrorPath(error);
      if (!instancePath) throw error;

      throw new AJVValidationError([
        { ...(error as PropertyNotTranslatableError).asAJV(), instancePath },
      ]);
    }
  }

  private static translationErrorPath(error: unknown) {
    if (
      error instanceof PropertyNotTranslatableError ||
      error instanceof MissingTranslatedPropertyError ||
      error instanceof RequiredTranslatedPropertyError
    ) {
      return `/translations/${error.language}/${error.property}`;
    }
    if (
      error instanceof UnknownTranslationLanguageError ||
      error instanceof TargetLanguageInTranslationsError ||
      error instanceof MissingTranslationLanguageError
    ) {
      return `/translations/${error.language}`;
    }
    return undefined;
  }

  private async respondWithTranslations(
    sharedId: string,
    isMultipart: boolean,
    language: LanguageISO6391 = this.language
  ) {
    const entity = await EntitiesQueryServiceFactory.default(this.user).getEntity({
      sharedId,
      language,
      includeRelationships: false,
      includePermissions: true,
      includeTranslations: true,
      user: this.user,
    });

    this.response.json(isMultipart ? { entity, errors: [] } : entity);
  }

  private async resolveAutomaticTranslationConflicts(
    parsed: UpdateEntityRequest,
    isMultipart: boolean,
    translations?: EntityTranslationsRequest
  ): Promise<{ target: UpdateEntityRequest; translations?: EntityTranslationsRequest }> {
    const currentDocs = await EntitiesDAOFactory.default({ user: this.user }).getBySharedId(
      parsed.sharedId
    );
    const currentDoc = currentDocs.find(doc => doc.language === parsed.language);
    if (!currentDoc) return { target: parsed, translations };

    const resolver = new ATConflictSolver(
      AutomaticTranslationFactory.defaultATConfigDataSource(),
      ExecutionContext.logger
    );
    const target = await resolver.execute(currentDoc, parsed);
    const resolvedTranslations =
      translations &&
      (await resolver.resolveTranslations(
        currentDocs,
        currentDoc.template.toString(),
        translations
      ));

    this.syncLoggedBody(
      resolvedTranslations ? { ...target, translations: resolvedTranslations } : target,
      isMultipart
    );

    return { target, translations: resolvedTranslations };
  }

  // Keep the logged request body in sync with what is actually saved.
  private syncLoggedBody(body: Record<string, unknown>, isMultipart: boolean) {
    if (isMultipart) {
      this.request.body.entity = JSON.stringify(body);
    } else {
      Object.assign(this.request.body, body);
    }
  }

  private async respond(
    sharedId: string,
    isMultipart: boolean,
    language: LanguageISO6391 = this.language
  ) {
    const [entity] = await EntitiesDAOFactory.default({ user: this.user }).find(
      { sharedId, language },
      { withFiles: true }
    );

    this.response.json(isMultipart ? { entity, errors: [] } : entity);
  }
}

export { MutateEntityController };
