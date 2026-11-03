import { ObjectId } from 'mongodb';
import type { V1Relationship } from '#shared/contracts/RelationshipsV1DataSource.js';
import { RelationshipsHubSelection } from '../RelationshipsHubSelection.js';

const rel1 = new ObjectId();
const rel2 = new ObjectId();

const connection = (entity: string, template: ObjectId | null): V1Relationship => ({
  _id: new ObjectId(),
  hub: new ObjectId(),
  entity,
  template,
});

describe('RelationshipsHubSelection', () => {
  describe('byRelationType', () => {
    const connections = [connection('a', rel1), connection('b', rel2), connection('c', null)];

    const entities = (filtered: V1Relationship[]) => filtered.map(c => c.entity);

    it('should keep every connection when there is no relation type filter', () => {
      expect(entities(RelationshipsHubSelection.byRelationType(connections, []))).toEqual([
        'a',
        'b',
        'c',
      ]);
    });

    it('should keep connections whose relation type is in the filter', () => {
      expect(
        entities(
          RelationshipsHubSelection.byRelationType(connections, [new ObjectId(rel2.toString())])
        )
      ).toEqual(['b']);
    });

    it('should match connections without relation type against a null filter entry', () => {
      expect(entities(RelationshipsHubSelection.byRelationType(connections, [null, rel1]))).toEqual(
        ['a', 'c']
      );
    });
  });
});
