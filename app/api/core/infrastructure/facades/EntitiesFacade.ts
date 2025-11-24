import { CreateEntityUseCaseInput } from 'api/core/application/CreateEntity';
import { InputFile } from 'api/core/domain/files/InputFile';
import { CreateEntityDTO, CreateEntitySchema } from '../express/entity/Schemas';
import { CreateEntityUseCaseFactory } from '../factories/CreateEntityUseCaseFactory';
import { LoggerFactory } from '../factories/LoggerFactory';

export class EntityFacade {
  static async create(dto: CreateEntityDTO, inputFiles?: InputFile[]) {
    const logger = LoggerFactory.default();

    try {
      const useCase = CreateEntityUseCaseFactory.default();

      const parsed = CreateEntitySchema.parse(dto);

      const input: CreateEntityUseCaseInput = {
        templateId: parsed?.template?.toString(),
        icon: parsed?.icon && {
          id: parsed.icon._id!,
          label: parsed.icon.label!,
          type: parsed.icon.type!,
        },

        inputFiles,

        propertyAssignments: [
          {
            name: 'title',
            value: [{ value: parsed.title }],
          },

          ...(Object.entries(parsed.metadata || {}).map(([name, value]) => ({
            name,
            value,
          })) as CreateEntityUseCaseInput['propertyAssignments']),
        ],
      };

      const entity = await useCase.execute(input);

      return entity;
    } catch (error) {
      logger.info(
        `[EntityCreation] - Error - ${JSON.stringify(error)} - DTO: ${JSON.stringify(dto)}`
      );

      throw error;
    }
  }
}
