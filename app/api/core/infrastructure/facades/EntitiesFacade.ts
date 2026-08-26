import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  CreateEntityDTO,
  CreateEntitySchema,
  UpdateEntityRequest,
  UpdateEntitySchema,
} from '../express/entity/Schemas.js';
import { CreateEntityUseCaseFactory } from '../factories/CreateEntityUseCaseFactory.js';
import { ExpressEntityMapper } from '../express/entity/ExpressEntityMapper.js';
import { UpdateEntityUseCaseFactory } from '../factories/UpdateEntityUseCaseFactory.js';

export class EntityFacade {
  static async create(
    dto: CreateEntityDTO,
    targetLanguage: LanguageISO6391,
    inputFiles?: InputFile[]
  ) {
    const parsed = CreateEntitySchema.parse(dto);
    const input = ExpressEntityMapper.toEntityCreateInput({ dto: parsed, inputFiles });
    const useCase = CreateEntityUseCaseFactory.default({ targetLanguage });
    const entity = await useCase.execute(input);
    return entity;
  }

  static async update(
    dto: UpdateEntityRequest,
    targetLanguage: LanguageISO6391,
    inputFiles?: InputFile[]
  ) {
    const parsed = UpdateEntitySchema.parse({
      ...dto,
      language: dto.language || targetLanguage,
    });
    const input = ExpressEntityMapper.toEntityUpdateInput({ dto: parsed, inputFiles });
    const useCase = UpdateEntityUseCaseFactory.default();
    const entity = await useCase.execute(input);
    return entity;
  }
}
