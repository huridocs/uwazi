import { AbstractUseCase } from '../libs/UseCase.js';
import { RelationshipType } from '../domain/relationshipType/RelationshipType.js';
import { RelationshipTypesDataSource } from './contracts/RelationshipTypesDataSource.js';
import { RelationshipTypesTranslationService } from './contracts/RelationshipTypesTranslationService.js';

type Input = {
  name: string;
};

type Output = RelationshipType;

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
  translationService: RelationshipTypesTranslationService;
};

class CreateRelationshipTypeUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const duplicated = await this.deps.relationshipTypesDS.existsByName(input.name);
    if (duplicated) {
      throw new Error('duplicated_entry');
    }

    const relationshipType = new RelationshipType(this.idGenerator.generate(), input.name);

    await this.transactionManager.run(async () => {
      await this.deps.relationshipTypesDS.create(relationshipType);
      await this.deps.translationService.create(relationshipType);
    });

    return relationshipType;
  }
}

export { CreateRelationshipTypeUseCase };
export type { Input as CreateRelationshipTypeUseCaseInput };
