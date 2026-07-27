import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { RelationshipTypesDataSource } from '../contracts/RelationshipTypesDataSource.js';
import { RelationshipType } from '../model/RelationshipType.js';

type Input = {
  id?: string;
};

type Output = RelationshipType[];

type Deps = {
  relationshipTypesDS: RelationshipTypesDataSource;
};

class GetRelationshipTypesUseCase extends AbstractUseCase<Input, Output, Deps> {
  async execute(input: Input): Promise<Output> {
    if (input.id) {
      const item = await this.deps.relationshipTypesDS.getById(input.id);
      return item ? [item] : [];
    }

    return this.deps.relationshipTypesDS.getAll();
  }
}

export { GetRelationshipTypesUseCase };
export type { Input as GetRelationshipTypesUseCaseInput };
