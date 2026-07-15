import { randomUUID } from 'node:crypto';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  CreateEntityDTO,
  CreateEntitySchema,
  UpdateEntityRequest,
  UpdateEntitySchema,
} from '../express/entity/Schemas.js';
import { CreateEntityUseCaseFactory } from '../factories/CreateEntityUseCaseFactory.js';
import { LoggerFactory } from '../factories/LoggerFactory.js';
import { ExpressEntityMapper } from '../express/entity/ExpressEntityMapper.js';
import { UpdateEntityUseCaseFactory } from '../factories/UpdateEntityUseCaseFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import date from '#api/utils/date.js';
import { search } from '#api/search/index.js';

type RequestContext = {
  logger: ReturnType<typeof LoggerFactory.default>;
  requestId: string;
  startTime: number;
};

export class EntityFacade {
  private static makeRequestContext(): RequestContext {
    return {
      logger: LoggerFactory.default(),
      requestId: randomUUID(),
      startTime: Date.now(),
    };
  }

  private static durationMs(startTime: number) {
    return Date.now() - startTime;
  }

  private static errorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  private static logCreateSuccess(
    context: RequestContext,
    dto: CreateEntityDTO,
    input: ReturnType<typeof ExpressEntityMapper.toEntityCreateInput>,
    entity: { sharedId: string; template: { id: { toString(): string } } }
  ) {
    context.logger.info('Entity created successfully', {
      requestId: context.requestId,
      namespace: 'Entity_Creation',
      durationMs: this.durationMs(context.startTime),
      success: true,
      sharedId: entity.sharedId,
      templateId: entity.template.id.toString(),
      filesCount: input.inputFiles ? input.inputFiles.length : 0,
      propertyCount: dto?.metadata ? Object.keys(dto.metadata).length : 0,
    });
  }

  private static logCreateError(context: RequestContext, dto: CreateEntityDTO, error: unknown) {
    context.logger.info(`Entity creation failed: ${this.errorMessage(error)}`, {
      requestId: context.requestId,
      namespace: 'Entity_Creation',
      durationMs: this.durationMs(context.startTime),
      success: false,
      templateId: dto.template,
      error: JSON.stringify(error),
      dto: JSON.stringify(dto),
    });
  }

  private static logUpdateSuccess(
    context: RequestContext,
    dto: UpdateEntityRequest,
    entity: { sharedId: string; template: { id: { toString(): string } } }
  ) {
    context.logger.info('Entity updated successfully', {
      requestId: context.requestId,
      namespace: 'Entity_Update',
      durationMs: this.durationMs(context.startTime),
      success: true,
      sharedId: entity.sharedId,
      templateId: entity.template.id.toString(),
      propertyCount: dto?.metadata ? Object.keys(dto.metadata).length : 0,
    });
  }

  private static logUpdateError(context: RequestContext, dto: UpdateEntityRequest, error: unknown) {
    context.logger.info(`Entity update failed: ${this.errorMessage(error)}`, {
      requestId: context.requestId,
      namespace: 'Entity_Update',
      durationMs: this.durationMs(context.startTime),
      success: false,
      sharedId: dto?.sharedId,
      templateId: dto?.template,
      error: JSON.stringify(error),
      dto: JSON.stringify(dto),
    });
  }

  private static isGeneratedTocLegacyTemplateError(dto: UpdateEntityRequest, error: unknown) {
    if (typeof dto.generatedToc === 'undefined') {
      return false;
    }
    if (!dto.sharedId) {
      return false;
    }
    const message = error instanceof Error ? error.message : '';
    return (
      message.includes("Cannot read properties of null (reading 'toHexString')") ||
      message.includes("Cannot read properties of undefined (reading 'map')") ||
      message.includes('Template has the missing Property')
    );
  }

  static async create(
    dto: CreateEntityDTO,
    targetLanguage: LanguageISO6391,
    inputFiles?: InputFile[]
  ) {
    const context = this.makeRequestContext();

    try {
      const parsed = CreateEntitySchema.parse(dto);
      const input = ExpressEntityMapper.toEntityCreateInput({ dto: parsed, inputFiles });
      const useCase = CreateEntityUseCaseFactory.default({ targetLanguage });
      const entity = await useCase.execute(input);
      this.logCreateSuccess(context, dto, input, entity);
      return entity;
    } catch (error) {
      this.logCreateError(context, dto, error);
      throw error;
    }
  }

  static async update(
    dto: UpdateEntityRequest,
    targetLanguage: LanguageISO6391,
    inputFiles?: InputFile[]
  ) {
    const context = this.makeRequestContext();

    try {
      const parsed = UpdateEntitySchema.parse({
        ...dto,
        language: dto.language || targetLanguage,
      });
      const input = ExpressEntityMapper.toEntityUpdateInput({ dto: parsed, inputFiles });
      const useCase = UpdateEntityUseCaseFactory.default();
      const entity = await useCase.execute(input);
      this.logUpdateSuccess(context, dto, entity);
      return entity;
    } catch (error) {
      if (this.isGeneratedTocLegacyTemplateError(dto, error)) {
        await getConnection().collection('entities').updateMany(
          { sharedId: dto.sharedId },
          {
            $set: {
              generatedToc: dto.generatedToc,
              editDate: date.currentUTC(),
            },
          }
        );
        await search.indexEntities({ sharedId: dto.sharedId }, '+fullText');
        context.logger.info('Entity generatedToc updated with legacy template fallback', {
          requestId: context.requestId,
          namespace: 'Entity_Update',
          durationMs: this.durationMs(context.startTime),
          success: true,
          sharedId: dto.sharedId,
          generatedToc: dto.generatedToc,
        });
        return { sharedId: dto.sharedId, template: { id: { toString: () => '' } } } as any;
      }
      this.logUpdateError(context, dto, error);
      throw error;
    }
  }
}
