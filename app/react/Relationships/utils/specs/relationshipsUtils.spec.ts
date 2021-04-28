import Immutable from 'immutable';
import { filterVisibleConnections } from 'app/Relationships/utils/relationshipsUtils';

describe('relationshipsUtils', () => {
  describe('filterVisibleConnections', () => {
    it('should filter connectionGroups based in hub availability of entities', () => {
      const connectionsGroups = Immutable.fromJS([
        { key: 'g1', templates: [{ _id: 't1', count: 1 }] },
        {
          key: 'g2',
          templates: [
            { _id: 't2', count: 2 },
            { _id: 't3', count: 3 },
          ],
        },
        { key: 'g3', templates: [{ _id: 't4', count: 4 }] },
        {
          key: 'g4',
          templates: [
            { _id: 't2', count: 5 },
            { _id: 't6', count: 6 },
          ],
        },
        { key: 'g5', templates: [{ _id: 't6', count: 6 }] },
      ]);
      const hubs = Immutable.fromJS([
        {
          hub: '1',
          rightRelationships: [
            { template: 'g1', relationships: [{ entityData: { template: 't1' } }] },
          ],
        },
        {
          hub: '2',
          rightRelationships: [
            { template: 'g2', relationships: [{ entityData: { template: 't2' } }] },
            { template: 'g2', relationships: [{ entityData: { template: 't3' } }] },
          ],
        },
        {
          hub: '4',
          rightRelationships: [
            { template: 'g4', relationships: [{ entityData: { template: 't2' } }] },
          ],
        },
        {
          hub: '5',
          rightRelationships: [
            { template: 'g5', relationships: [{ entityData: { template: 't6' } }] },
          ],
        },
      ]);
      const filteredConnections = filterVisibleConnections(connectionsGroups, hubs);
      expect(filteredConnections.size).toBe(4);
      expect(filteredConnections.get(0).get('key')).toEqual('g1');
      expect(filteredConnections.get(1).get('key')).toEqual('g2');
      expect(filteredConnections.get(2).get('key')).toEqual('g4');
      expect(filteredConnections.get(2).get('templates').size).toEqual(1);
      expect(filteredConnections.get(3).get('key')).toEqual('g5');
      expect(filteredConnections.get(3).get('templates').size).toEqual(1);
    });
  });
});
