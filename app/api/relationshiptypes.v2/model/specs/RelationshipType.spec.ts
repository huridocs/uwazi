import { RelationshipType } from '../RelationshipType.js';

describe('RelationshipType', () => {
  it('should create a relationship type model', () => {
    const model = new RelationshipType('rel-id', 'Related To');

    expect(model.id).toBe('rel-id');
    expect(model.name).toBe('Related To');
  });
});
