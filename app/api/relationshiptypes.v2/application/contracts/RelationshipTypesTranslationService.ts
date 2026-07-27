import { RelationshipType } from '../../model/RelationshipType.js';

interface RelationshipTypesTranslationService {
  create(relationshipType: RelationshipType): Promise<void>;
  update(before: RelationshipType, after: RelationshipType): Promise<void>;
  delete(relationshipTypeId: string): Promise<void>;
}

export type { RelationshipTypesTranslationService };
