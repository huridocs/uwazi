import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { randomUUID } from 'node:crypto';
import { CreateEntityDTO, CreateEntitySchema } from '../express/entity/Schemas.js';
import { CreateEntityUseCaseFactory } from '../factories/CreateEntityUseCaseFactory.js';
import { LoggerFactory } from '../factories/LoggerFactory.js';
import { ExpressEntityMapper } from '../express/entity/ExpressEntityMapper.js';

export class EntityFacade {
  static async create(dto: CreateEntityDTO, inputFiles?: InputFile[]) {
    const logger = LoggerFactory.default();
    const startTime = Date.now();
    const requestId = randomUUID();

    try {
      const useCase = CreateEntityUseCaseFactory.default();

      const parsed = CreateEntitySchema.parse(dto);

      const input = ExpressEntityMapper.toEntityCreateInput({ dto: parsed, inputFiles });

      const entity = await useCase.execute(input);

      const duration = Date.now() - startTime;

      logger.info('Entity created successfully', {
        requestId,
        namespace: 'Entity_Creation',
        durationMs: duration,
        success: true,

        sharedId: entity.sharedId,
        templateId: entity.template.id.toString(),
        filesCount: input.inputFiles ? input.inputFiles.length : 0,
        propertyCount: dto?.metadata ? Object.keys(dto.metadata).length : 0,
      });

      return entity;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `Entity creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          requestId,
          namespace: 'Entity_Creation',
          durationMs: duration,
          success: false,

          templateId: dto.template,
          error: JSON.stringify(error),
          dto: JSON.stringify(dto),
        }
      );

      throw error;
    }
  }
}
