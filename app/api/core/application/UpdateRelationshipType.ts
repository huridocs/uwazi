import { AbstractUseCase } from '../libs/UseCase.js';
import { RelationshipType } from '../domain/relationshipType/RelationshipType.js';
import { RelationshipTypesDataSource } from './contracts/RelationshipTypesDataSource.js';
import { RelationshipTypeTranslationService } from '../domain/relationshipType/RelationshipTypeTranslationService.js';

type Input = {
  id: string;
  name: string;
};

type Output = RelationshipType;

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
  relationshipTypeTranslationService: RelationshipTypeTranslationService;
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

    const updated = new RelationshipType(input.id, input.name);

    await this.transactionManager.run(async () => {
      await this.deps.relationshipTypesDS.update(updated);
      await this.deps.relationshipTypeTranslationService.update(current, updated);
    });

    return updated;
  }
}

export { UpdateRelationshipTypeUseCase };
export type { Input as UpdateRelationshipTypeUseCaseInput };
