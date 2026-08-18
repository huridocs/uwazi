import { AbstractUseCase } from '../libs/UseCase.js';
import { RelationshipType } from '../domain/relationshipType/RelationshipType.js';
import { RelationshipTypesDataSource } from './contracts/RelationshipTypesDataSource.js';
import { RelationshipTypeTranslationService } from '../domain/relationshipType/RelationshipTypeTranslationService.js';

type Input = {
  name: string;
};

type Output = RelationshipType;

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
  relationshipTypeTranslationService: RelationshipTypeTranslationService;
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
      await this.deps.relationshipTypeTranslationService.create(relationshipType);
    });

    return relationshipType;
  }
}

export { CreateRelationshipTypeUseCase };
export type { Input as CreateRelationshipTypeUseCaseInput };
