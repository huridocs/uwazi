import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';

/**
 * Port for syncing RelationshipType names into translation contexts.
 * Implementations must share the RelationshipType UseCase transaction boundary.
 */
interface RelationshipTypeTranslationService {
  create(relationshipType: RelationshipType): Promise<void>;
  update(before: RelationshipType, after: RelationshipType): Promise<void>;
  delete(relationshipTypeId: string): Promise<void>;
}

export type { RelationshipTypeTranslationService };
