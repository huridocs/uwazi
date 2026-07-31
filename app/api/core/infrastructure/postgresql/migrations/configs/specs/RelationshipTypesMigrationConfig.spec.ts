import { ObjectId } from 'mongodb';
import { RelationshipTypesMigrationConfig } from '../RelationshipTypesMigrationConfig.js';

describe('RelationshipTypesMigrationConfig', () => {
  it('should map mongo relationtypes docs to relationship_types rows', () => {
    const id = new ObjectId();
    const mapped = RelationshipTypesMigrationConfig.mapDocument({
      _id: id,
      name: 'Related to',
      properties: [{ label: 'legacy' }],
    });

    expect(RelationshipTypesMigrationConfig.mongoCollection).toBe('relationtypes');
    expect(RelationshipTypesMigrationConfig.pgTable).toBe('relationship_types');
    expect(mapped).toEqual({
      _id: id.toHexString(),
      name: 'Related to',
    });
    expect(mapped).not.toHaveProperty('properties');
  });

  it('should stringify non-ObjectId ids', () => {
    const mapped = RelationshipTypesMigrationConfig.mapDocument({
      _id: 'abc123',
      name: 'Named',
    });

    expect(mapped._id).toBe('abc123');
  });
});
