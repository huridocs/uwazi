import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';

export type RelationshipTypeRow = {
  _id: string;
  name: string;
};

export class PostgresRelationshipTypeMapper {
  static toDomain(row: RelationshipTypeRow): RelationshipType {
    return new RelationshipType(row._id, row.name);
  }

  static toDBO(relationshipType: RelationshipType): RelationshipTypeRow {
    return {
      _id: relationshipType.id,
      name: relationshipType.name,
    };
  }
}
