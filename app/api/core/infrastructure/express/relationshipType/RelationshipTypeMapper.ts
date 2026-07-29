import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';

type RelationshipTypeDTO = {
  _id: string;
  name: string;
};

const toDTO = (relationshipType: RelationshipType): RelationshipTypeDTO => ({
  _id: relationshipType.id,
  name: relationshipType.name,
});

export { toDTO };
export type { RelationshipTypeDTO };
