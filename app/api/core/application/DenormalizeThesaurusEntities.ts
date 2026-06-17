import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { AbstractUseCase } from '../libs/UseCase.js';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { EntitiesService } from './EntitiesService.js';

type Input = {
  thesaurusId: string;
  sharedIds: string[];
};

type Output = void;

type Deps = {
  entitiesDS: MultiLanguageEntityDataSource;
  entitiesService: EntitiesService;
  propertyAssignmentCreatorServiceStrategy: PropertyAssignmentCreatorServiceStrategy;
};

class DenormalizeThesaurusEntitiesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const entities = await (
      await this.deps.entitiesDS.getEntitiesBySharedIds(input.sharedIds)
    ).all();

    if (entities.length === 0) {
      return;
    }

    const [withRelationships, withoutRelationships] = ArrayUtils.splitInTwo(
      entities,
      entity => entity.getRelationshipAssignmentsInheritingFromSelect().length > 0
    );

    await this.transactionManager.run(async () => {
      await ArrayUtils.sequentialFor(withoutRelationships, async entity => {
        const propertyAssignments =
          await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
            entity.getSelectAssignmentsByThesaurusId(input.thesaurusId),
            entity.template
          );

        entity.setPropertyAssignmentsInAllLanguages(propertyAssignments);
      });

      await this.deps.entitiesService.updateMultiple(withoutRelationships, {
        actorId: this.actorId,
        targetLanguage: withoutRelationships[0]!.languages[0],
        authorize: false,
      });

      await ArrayUtils.sequentialFor(withRelationships, async entity => {
        const propertyAssignments =
          await this.deps.propertyAssignmentCreatorServiceStrategy.bulkCreate(
            [
              ...entity.getRelationshipAssignmentsInheritingFromSelect(),
              ...entity.getSelectAssignmentsByThesaurusId(input.thesaurusId),
            ],
            entity.template
          );
        entity.setPropertyAssignmentsInAllLanguages(propertyAssignments);
      });

      await this.deps.entitiesService.updateMultiple(withRelationships, {
        actorId: this.actorId,
        targetLanguage: withRelationships[0]!.languages[0],
        authorize: false,
      });
    });
  }
}

export { DenormalizeThesaurusEntitiesUseCase };
export type { Input as DenormalizeThesaurusEntitiesUseCaseInput };
