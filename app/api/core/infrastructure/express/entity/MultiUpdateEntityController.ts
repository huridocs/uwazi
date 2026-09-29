import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { MultiUpdateEntity } from '#api/core/application/MultiUpdateEntity.js';
import { PropertyAssignmentInput } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MultiUpdateEntityUseCaseFactory } from '../../factories/MultiUpdateEntityUseCaseFactory.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';
import { ExpressEntityMapper } from './ExpressEntityMapper.js';
import { EntityTranslationsRequest, EntityTranslationsSchema } from './Schemas.js';

type RequestDto = {
  ids: string[];
  values: {
    metadata?: Record<string, unknown[]>;
    template?: string;
    translations?: EntityTranslationsRequest;
  };
};

class MultiUpdateEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const useCase = MultiUpdateEntityUseCaseFactory.default();
    const input = this.parseInput();
    const output = await useCase.execute(input);
    const updatedEntities = await this.loadUpdated(output, input.targetLanguage);

    this.response.json(updatedEntities);
  }

  private parseInput() {
    const parsed = MultiUpdateEntity.InputSchema.parse({ ids: this.request.body?.ids || [] });
    const { values = {} } = this.request.body;
    const propertyAssignments = MultiUpdateEntityController.toPropertyAssignments(values.metadata);
    const translations = values.translations
      ? ExpressEntityMapper.toTranslationsInput(EntityTranslationsSchema.parse(values.translations))
      : undefined;

    return {
      ids: parsed.ids,
      targetLanguage: this.language,
      values: {
        propertyAssignments,
        templateId: values.template?.toString(),
        translations,
      },
    };
  }

  private static toPropertyAssignments(
    metadata: Record<string, unknown[]> | undefined
  ): PropertyAssignmentInput[] | undefined {
    if (!metadata) return undefined;

    return Object.entries(metadata).map(([name, value]) => ({
      name,
      value,
    })) as PropertyAssignmentInput[];
  }

  private async loadUpdated(output: { sharedId: string }[], targetLanguage: LanguageISO6391) {
    const sharedIds = [...new Set(output.map(entity => entity.sharedId))];
    const entityDAO = EntitiesDAOFactory.default({ user: this.user });

    return entityDAO.find({ sharedIds, language: targetLanguage }, { withFiles: true });
  }
}

export { MultiUpdateEntityController };
