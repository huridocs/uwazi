import { filterVisibleConnections } from 'app/Relationships/utils/relationshipsUtils';

describe('relationshipsUtils', () => {
  describe('filterVisibleConnections', () => {
    const connectionsGroups = [
      { key: 'visibleGroup1', templates: [{ _id: 'template1' }] },
      { key: 'visibleGroup2', templates: [{ _id: 'template2' }, { _id: 'template3' }] },
      { key: 'hiddenGroup1', templates: [{ _id: 'template4' }] },
      { key: 'visibleGroup3', templates: [{ _id: 'template2' }, { _id: 'template4' }] },
      { key: 'visibleGroup4', templates: [{ _id: 'template1' }, { _id: 'template4' }] },
    ];
    const hubs = [
      {
        hub: '1',
        rightRelationships: [
          { template: 'visibleGroup1', relationships: [{ entityData: { template: 'template1' } }] },
        ],
      },
      {
        hub: '2',
        rightRelationships: [
          { template: 'visibleGroup2', relationships: [{ entityData: { template: 'template2' } }] },
          { template: 'visibleGroup2', relationships: [{ entityData: { template: 'template3' } }] },
        ],
      },
      {
        hub: '3',
        rightRelationships: [
          { template: 'visibleGroup3', relationships: [{ entityData: { template: 'template2' } }] },
        ],
      },
      {
        hub: '4',
        rightRelationships: [
          { template: 'visibleGroup4', relationships: [{ entityData: { template: 'template4' } }] },
        ],
      },
    ];

    it('should only return the groups and templates that are contained in the hubs', () => {
      const filteredConnections = filterVisibleConnections(connectionsGroups, hubs).toJS();
      expect(filteredConnections.length).toBe(4);
      expect(filteredConnections[0].key).toEqual('visibleGroup1');
      expect(filteredConnections[1].key).toEqual('visibleGroup2');
      expect(filteredConnections[1].templates).toEqual([
        { _id: 'template2' },
        { _id: 'template3' },
      ]);
      expect(filteredConnections[2].key).toEqual('visibleGroup3');
      expect(filteredConnections[2].templates).toEqual([{ _id: 'template2' }]);
      expect(filteredConnections[3].key).toEqual('visibleGroup4');
      expect(filteredConnections[3].templates).toEqual([{ _id: 'template4' }]);
    });

    it('should not return anything if there is not hubs data', () => {
      const filteredConnections = filterVisibleConnections(connectionsGroups, []).toJS();
      expect(filteredConnections.length).toBe(0);
    });
  });
});
