import type { RelationshipTypesTranslationService } from '#api/core/application/contracts/RelationshipTypesTranslationService.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';
import { CreateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/CreateTranslationContextUseCaseFactory.js';
import { DeleteTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/DeleteTranslationContextUseCaseFactory.js';
import { UpdateTranslationContextUseCaseFactory } from '#api/core/infrastructure/factories/UpdateTranslationContextUseCaseFactory.js';

class LegacyRelationshipTypesTranslationService implements RelationshipTypesTranslationService {
  // eslint-disable-next-line class-methods-use-this
  async create(relationshipType: RelationshipType): Promise<void> {
    await CreateTranslationContextUseCaseFactory.default().execute({
      context: {
        id: relationshipType.id,
        label: relationshipType.name,
        type: 'Relationship Type',
      },
      values: { [relationshipType.name]: relationshipType.name },
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async update(current: RelationshipType, updated: RelationshipType): Promise<void> {
    const keyChanges =
      current.name !== updated.name ? { [current.name]: updated.name } : {};

    await UpdateTranslationContextUseCaseFactory.default().execute({
      context: {
        id: updated.id,
        label: updated.name,
        type: 'Relationship Type',
      },
      keyChanges,
      keysToDelete: [],
      valueChanges: { [updated.name]: updated.name },
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async delete(relationshipTypeId: string): Promise<void> {
    await DeleteTranslationContextUseCaseFactory.default().execute({
      contextId: relationshipTypeId,
    });
  }
}

export { LegacyRelationshipTypesTranslationService };
