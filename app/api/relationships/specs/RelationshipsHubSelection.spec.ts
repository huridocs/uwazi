import { ObjectId } from 'mongodb';
import type { V1Relationship } from '#shared/contracts/RelationshipsV1DataSource.js';
import { RelationshipsHubSelection } from '../RelationshipsHubSelection.js';

const rel1 = new ObjectId();
const rel2 = new ObjectId();
const templateA = new ObjectId();
const templateB = new ObjectId();

const connection = (
  entity: string,
  template: ObjectId | null,
  hub: ObjectId = new ObjectId()
): V1Relationship => ({
  _id: new ObjectId(),
  hub,
  entity,
  template,
});

const entities = (filtered: V1Relationship[]) => filtered.map(c => c.entity);

describe('RelationshipsHubSelection', () => {
  describe('byRelationType', () => {
    const connections = [connection('a', rel1), connection('b', rel2), connection('c', null)];

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

  describe('indexSearchRows', () => {
    it('should index rows by sharedId with their position and template', () => {
      const index = RelationshipsHubSelection.indexSearchRows([
        { sharedId: 'b', template: templateB },
        { sharedId: 'a', template: templateA },
      ]);

      expect(index.get('b')).toEqual({ position: 0, template: templateB.toString() });
      expect(index.get('a')).toEqual({ position: 1, template: templateA.toString() });
      expect(index.has('c')).toBe(false);
    });
  });

  describe('matchingConnections', () => {
    const rows = RelationshipsHubSelection.indexSearchRows([
      { sharedId: 'a', template: templateA },
      { sharedId: 'b', template: templateB },
    ]);

    it('should match nothing when there are no filter combinations', () => {
      const connections = [connection('a', rel1)];
      expect(RelationshipsHubSelection.matchingConnections(connections, rows, [])).toEqual([]);
    });

    it('should keep connections whose relation type and entity template form a combination', () => {
      const connections = [
        connection('a', rel1),
        connection('a', rel2),
        connection('b', rel1),
        connection('c', rel1),
      ];

      const matching = RelationshipsHubSelection.matchingConnections(connections, rows, [
        { relationTypeId: rel1, entityTemplateId: templateA.toString() },
      ]);

      expect(matching).toEqual([connections[0]]);
    });

    it('should match connections without relation type against a null combination', () => {
      const connections = [connection('b', null), connection('b', rel1)];

      const matching = RelationshipsHubSelection.matchingConnections(connections, rows, [
        { relationTypeId: null, entityTemplateId: templateB.toString() },
      ]);

      expect(matching).toEqual([connections[0]]);
    });
  });

  describe('candidateConnections', () => {
    const rows = RelationshipsHubSelection.indexSearchRows([
      { sharedId: 'a', template: templateA },
    ]);
    const all = [connection('a', rel1), connection('a', rel2), connection('b', rel1)];

    it('should use the matching connections when there are any', () => {
      expect(RelationshipsHubSelection.candidateConnections([all[1]], all, rows)).toEqual([all[1]]);
    });

    it('should fall back to every connection reaching a search result, of any relation type', () => {
      expect(RelationshipsHubSelection.candidateConnections([], all, rows)).toEqual([
        all[0],
        all[1],
      ]);
    });
  });

  describe('countHubs', () => {
    it('should count distinct hubs', () => {
      const hub = new ObjectId();
      const connections = [
        connection('a', rel1, hub),
        connection('b', rel1, new ObjectId(hub.toString())),
        connection('c', rel1),
      ];

      expect(RelationshipsHubSelection.countHubs(connections)).toBe(2);
    });
  });

  describe('topHubIds', () => {
    const rows = RelationshipsHubSelection.indexSearchRows([
      { sharedId: 'a', template: templateA },
      { sharedId: 'b', template: templateA },
      { sharedId: 'c', template: templateA },
    ]);
    const [hub1, hub2, hub3, hub4] = [1, 2, 3, 4].map(() => new ObjectId());

    it('should order hubs by the best search position they reach and keep `limit`', () => {
      const candidates = [
        connection('c', rel1, hub1),
        connection('b', rel1, hub2),
        connection('c', rel1, hub3),
        connection('a', rel1, hub3),
      ];

      expect(RelationshipsHubSelection.topHubIds(candidates, rows, 2)).toEqual([
        hub3.toString(),
        hub2.toString(),
      ]);
    });

    it('should break ties by hub id', () => {
      const candidates = [connection('a', rel1, hub4), connection('a', rel1, hub2)];

      expect(RelationshipsHubSelection.topHubIds(candidates, rows, 10)).toEqual([
        hub2.toString(),
        hub4.toString(),
      ]);
    });

    it('should list each hub once', () => {
      const candidates = [connection('a', rel1, hub1), connection('b', rel1, hub1)];

      expect(RelationshipsHubSelection.topHubIds(candidates, rows, 10)).toEqual([hub1.toString()]);
    });
  });
});
