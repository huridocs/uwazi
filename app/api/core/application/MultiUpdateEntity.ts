import { z } from 'zod';
import { Entity } from '#api/core/domain/entity/Entity.js';
import { EntitiesDataSource } from '#api/core/application/contracts/EntitiesDataSource.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { PropertyAssignmentInput } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { TemplatesDataSource } from './contracts/TemplatesDataSource.js';
import { EntitiesService } from './EntitiesService.js';

const InputSchema = z.object({
  ids: z
    .array(z.string().trim())
    .min(1, 'You must provide at least one entity id for multiple update')
    .max(1000, 'You must provide at most 1000 entity ids for multiple update'),
});

type Input = z.infer<typeof InputSchema> & {
  targetLanguage: LanguageISO6391;
  values: {
    propertyAssignments?: PropertyAssignmentInput[];
    templateId?: string;
  };
};

type Output = Entity[];

type Deps = {
  entitiesDS: EntitiesDataSource;
  entitiesService: EntitiesService;
  templatesDS: TemplatesDataSource;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

class MultiUpdateEntity extends AbstractUseCase<Input, Output, Deps> {
  static InputSchema = InputSchema;

  async execute(input: Input): Promise<Output> {
    const { ids, targetLanguage, values } = input;

    if (ids.length === 0) return [];

    const entities = await (await this.deps.entitiesDS.getEntitiesBySharedIds(ids)).all();

    if (entities.length === 0) return [];

    const newTemplate = values.templateId
      ? (await this.deps.templatesDS.getById(values.templateId)).getDataOrThrow()
      : undefined;

    const referenceTemplate = newTemplate ?? entities[0].template;

    const propertyAssignments =
      values.propertyAssignments && values.propertyAssignments.length > 0
        ? await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
            values.propertyAssignments,
            referenceTemplate
          )
        : [];

    for (const entity of entities) {
      if (newTemplate && entity.template.id !== newTemplate.id) {
        entity.changeTemplate(newTemplate);
      }

      if (propertyAssignments.length > 0) {
        entity.setPropertyAssignments(propertyAssignments, targetLanguage, true);
      }
    }

    return this.transactionManager.run(async () => {
      const updatedIds = await this.deps.entitiesService.update(entities, {
        actorId: this.actorId,
        actor: this.getActor(),
        targetLanguage,
      });

      return entities.filter(e => updatedIds.includes(e.sharedId));
    });
  }
}

export { MultiUpdateEntity };
export type {
  Input as MultiUpdateEntityInput,
  Output as MultiUpdateEntityOutput,
  Deps as MultiUpdateEntityDeps,
};
