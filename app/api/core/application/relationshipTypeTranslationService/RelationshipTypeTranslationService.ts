import type { RelationshipTypesTranslationService } from '#api/core/application/contracts/RelationshipTypesTranslationService.js';
import { TranslationsService } from '#api/core/application/translation/TranslationsService.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';

type Deps = {
  translationsService: TranslationsService;
};

/**
 * Syncs RelationshipType names into translation contexts.
 * Must run inside the parent RelationshipType UseCase transaction (shared TM).
 */
class RelationshipTypeTranslationService implements RelationshipTypesTranslationService {
  constructor(private deps: Deps) {}

  async create(relationshipType: RelationshipType): Promise<void> {
    await this.deps.translationsService.createContext(
      {
        id: relationshipType.id,
        label: relationshipType.name,
        type: 'Relationship Type',
      },
      { [relationshipType.name]: relationshipType.name }
    );
  }

  async update(current: RelationshipType, updated: RelationshipType): Promise<void> {
    const keyChanges = current.name !== updated.name ? { [current.name]: updated.name } : {};

    await this.deps.translationsService.updateContext({
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

  async delete(relationshipTypeId: string): Promise<void> {
    await this.deps.translationsService.deleteByContextId(relationshipTypeId);
  }
}

export { RelationshipTypeTranslationService };
