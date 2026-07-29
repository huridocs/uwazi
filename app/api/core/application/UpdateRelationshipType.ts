import { AbstractUseCase } from '../libs/UseCase.js';
import { RelationshipType } from '../domain/relationshipType/RelationshipType.js';
import { RelationshipTypesDataSource } from './contracts/RelationshipTypesDataSource.js';
import { RelationshipTypesTranslationService } from './contracts/RelationshipTypesTranslationService.js';

type Input = {
  id: string;
  name: string;
};

type Output = RelationshipType;

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
  translationService: RelationshipTypesTranslationService;
};

class UpdateRelationshipTypeUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    const current = await this.deps.relationshipTypesDS.getById(input.id);
    if (!current) {
      throw new Error('Relationship type not found');
    }

    const duplicated = await this.deps.relationshipTypesDS.existsByName(input.name, input.id);
    if (duplicated) {
      throw new Error('duplicated_entry');
    }

    const updated = await this.transactionManager.run(async () => {
      const saved = await this.deps.relationshipTypesDS.update({ id: input.id, name: input.name });
      await this.deps.translationService.update(current, saved);
      return saved;
    });

    return updated;
  }
}

export { UpdateRelationshipTypeUseCase };
export type { Input as UpdateRelationshipTypeUseCaseInput };
