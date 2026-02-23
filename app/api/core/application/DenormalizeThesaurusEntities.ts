import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { AbstractUseCase } from '../libs/UseCase';
import { PropertyAssignmentCreatorServiceStrategy } from './propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';

type Input = {
  thesaurusId: string;
  sharedIds: string[];
};

type Output = void;

type Deps = {
  entitiesDS: MultiLanguageEntityDataSource;
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

      await this.deps.entitiesDS.bulkUpdate(withoutRelationships);

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

      await this.deps.entitiesDS.bulkUpdate(withRelationships);
    });
  }
}

export { DenormalizeThesaurusEntitiesUseCase };
export type { Input as DenormalizeThesaurusEntitiesUseCaseInput };
