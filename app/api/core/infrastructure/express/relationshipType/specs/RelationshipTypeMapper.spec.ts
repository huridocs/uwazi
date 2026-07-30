import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';
import { toDTO } from '../RelationshipTypeMapper.js';

describe('RelationshipTypeMapper', () => {
  it('should map domain model to dto', () => {
    const dto = toDTO(new RelationshipType('rel-id', 'References'));

    expect(dto).toEqual({ _id: 'rel-id', name: 'References' });
  });
});
