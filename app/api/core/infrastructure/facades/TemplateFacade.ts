import {
  CreateTemplateDTOSchema,
  UpdateTemplateDTOSchema,
} from 'api/core/application/TemplateDTOs';
import { UpdateTemplateUseCaseContext } from 'api/core/application/UpdateTemplate';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import { CreateTemplateUseCaseFactory } from '../factories/CreateTemplateUseCaseFactory';
import { TemplateDBO } from '../mongodb/template/DBOs/TemplateDBO';
import { UpdateTemplateUseCaseFactory } from '../factories/UpdateTemplateUseCaseFactory';
import { MongoTemplateMapper } from '../mongodb/template/Mapper';
import {
  DeleteTemplateRequestDto,
  DeleteTemplateSchema,
} from '../express/template/DeleteTemplateController/DTO';
import { DeleteTemplateUseCaseFactory } from '../factories/DeleteTemplateUseCaseFactory';
import {
  SetTemplateAsDefaultRequestDto,
  SetTemplateAsDefaultSchema,
} from '../express/template/SetTemplateAsDefaultController/DTO';
import { SetTemplateAsDefaultUseCaseFactory } from '../factories/SetTemplateAsDefaultUseCaseFactory';

type CreateDTO = Omit<TemplateDBO, '_id'>;
type UpdateDTO = TemplateDBO & { reindex: boolean };

export class TemplateFacade {
  static async create(dto: CreateDTO) {
    const useCase = CreateTemplateUseCaseFactory.create();

    const template = await useCase.execute(CreateTemplateDTOSchema.parse(dto));

    return MongoTemplateMapper.toSchema(template);
  }

  static async createWithDefaultValues(dto: Omit<CreateDTO, 'commonProperties'>) {
    return TemplateFacade.create({
      ...dto,
      commonProperties: [
        { name: 'title', label: 'Title', type: PropertyTypeEnum.Text },
        { name: 'creationDate', label: 'Date added', type: PropertyTypeEnum.Date },
        { name: 'editDate', label: 'Date modified', type: PropertyTypeEnum.Date },
      ],
    });
  }

  static async update(dto: UpdateDTO, language: LanguageISO6391) {
    const { reindex: fullReindex, ...template } = dto;

    const useCase = await UpdateTemplateUseCaseFactory.create();

    const input = UpdateTemplateDTOSchema.parse({
      ...template,
      id: template._id.toString(),
      properties: (template.properties || []).map(p => ({
        ...p,
        id: p._id?.toString(),
      })),
      commonProperties: (template.commonProperties || []).map(p => ({
        ...p,
        id: p._id?.toString(),
      })),
    });

    const context: UpdateTemplateUseCaseContext = {
      fullReindex,
      language,
    };

    const updated = await useCase.execute(input, context);

    return MongoTemplateMapper.toSchema(updated);
  }

  static async delete(dto: DeleteTemplateRequestDto) {
    const parsed = DeleteTemplateSchema.parse(dto);
    const useCase = await DeleteTemplateUseCaseFactory.create();

    await useCase.execute({ templateId: parsed._id.toString() });

    return parsed;
  }

  static async setAsDefault(dto: SetTemplateAsDefaultRequestDto) {
    const parsed = SetTemplateAsDefaultSchema.parse(dto);

    const output = await SetTemplateAsDefaultUseCaseFactory.create().execute({
      templateId: parsed._id.toString(),
    });

    return [
      MongoTemplateMapper.toSchema(output.current),
      output.previous && MongoTemplateMapper.toSchema(output.previous),
    ];
  }
}
