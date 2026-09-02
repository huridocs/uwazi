import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { MultiUpdateEntity } from '#api/core/application/MultiUpdateEntity.js';
import { MultiUpdateEntityUseCaseFactory } from '../../factories/MultiUpdateEntityUseCaseFactory.js';
import { EntitiesDAOFactory } from '../../factories/EntitiesDAOFactory.js';
import { PropertyAssignmentInput } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';

type RequestDto = {
  ids: string[];
  values: {
    metadata?: Record<string, unknown[]>;
    template?: string;
  };
};

class MultiUpdateEntityController extends AbstractController<RequestDto> {
  protected async handle(): Promise<void> {
    const useCase = MultiUpdateEntityUseCaseFactory.default();

    const parsed = MultiUpdateEntity.InputSchema.parse({ ids: this.request.body?.ids || [] });
    const { values = {} } = this.request.body;
    const targetLanguage = this.language;

    const propertyAssignments: PropertyAssignmentInput[] | undefined = values.metadata
      ? (Object.entries(values.metadata).map(([name, value]) => ({
          name,
          value,
        })) as PropertyAssignmentInput[])
      : undefined;

    const output = await useCase.execute({
      ids: parsed.ids,
      targetLanguage,
      values: {
        propertyAssignments,
        templateId: values.template?.toString(),
      },
    });

    const sharedIds = [...new Set(output.map(e => e.sharedId))];

    const entityDAO = EntitiesDAOFactory.default({ user: this.user });

    const updatedEntities = await entityDAO.find(
      { sharedIds, language: targetLanguage },
      { withFiles: true }
    );

    this.response.json(updatedEntities);
  }
}

export { MultiUpdateEntityController };
