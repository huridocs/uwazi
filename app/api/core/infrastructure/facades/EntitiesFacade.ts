import { InputFile } from 'api/core/domain/files/InputFile';
import { CreateEntityDTO, CreateEntitySchema } from '../express/entity/Schemas';
import { CreateEntityUseCaseFactory } from '../factories/CreateEntityUseCaseFactory';
import { LoggerFactory } from '../factories/LoggerFactory';
import { ExpressEntityMapper } from '../express/entity/ExpressEntityMapper';

export class EntityFacade {
  static async create(dto: CreateEntityDTO, inputFiles?: InputFile[]) {
    const logger = LoggerFactory.default();

    try {
      const useCase = CreateEntityUseCaseFactory.default();

      const parsed = CreateEntitySchema.parse(dto);

      const input = ExpressEntityMapper.toEntityCreateInput({ dto: parsed, inputFiles });

      const entity = await useCase.execute(input);

      return entity;
    } catch (error) {
      logger.info(`Error - ${JSON.stringify(error)} - DTO: ${JSON.stringify(dto)}`, {
        workflow: 'Entity_Creation',
      });

      throw error;
    }
  }
}
