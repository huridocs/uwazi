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

    const created = await this.transactionManager.run(async () => {
      const saved = await this.deps.relationshipTypesDS.create({ name: input.name });
      await this.deps.translationService.create(saved);
      return saved;
    });

    return created;
  }
}

export { CreateRelationshipTypeUseCase };
export type { Input as CreateRelationshipTypeUseCaseInput };
