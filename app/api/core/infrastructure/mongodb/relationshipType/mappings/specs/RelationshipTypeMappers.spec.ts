import { ObjectId } from 'mongodb';
import { mapRelationshipTypeToApp } from '../RelationshipTypeMappers.js';

describe('mapRelationshipTypeToApp', () => {
  it('should map dbo to domain model', () => {
    const _id = new ObjectId();
    const mapped = mapRelationshipTypeToApp({ _id, name: 'Parent -> Child' });

    expect(mapped.id).toBe(_id.toString());
    expect(mapped.name).toBe('Parent -> Child');
  });
});
