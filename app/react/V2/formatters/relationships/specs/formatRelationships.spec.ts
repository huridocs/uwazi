import type { RelationshipHubRow } from '#V2/api/relationships/types.js';
import { formatRelationships } from '../formatRelationships.js';

const entityWithReferences: RelationshipHubRow[] = [
  {
    template: 'relationshipType1',
    _id: 'conn1',
    hub: 'hub1',
    file: 'file1',
    entity: 'sharedId1',
    entityData: { title: 'Source Entity', template: 'template1' },
    reference: {
      text: 'selected text',
      selectionRectangles: [{ top: 10, left: 20, width: 100, height: 30, page: '1' }],
    },
  },
  {
    template: null,
    _id: 'conn2',
    hub: 'hub1',
    entity: 'targetSharedId',
    entityData: { title: 'Target Entity', template: 'targetTemplate1' },
  },
  {
    template: 'relationshipType2',
    _id: 'conn3',
    hub: 'hub2',
    file: 'file2',
    entity: 'sharedId1',
    entityData: { title: 'Source Entity', template: 'template1' },
    reference: {
      text: 'another selection',
      selectionRectangles: [{ top: 5, left: 15, width: 80, height: 20, page: '2' }],
    },
  },
  {
    template: null,
    _id: 'conn4',
    hub: 'hub2',
    entity: 'anotherSharedId',
    entityData: { title: 'Another Target', template: 'targetTemplate2' },
  },
];

const entityWithNoReferences: RelationshipHubRow[] = [
  {
    template: null,
    _id: 'conn5',
    hub: 'hub3',
    entity: 'someSharedId',
    entityData: { title: 'Some Entity', template: 'someTemplate' },
  },
];

const entityWithEntityLevelConnections: RelationshipHubRow[] = [
  {
    template: null,
    _id: 'conn-el-source',
    hub: 'hub-el',
    entity: 'sharedId-el',
    entityData: { title: 'Entity with entity-level connections', template: 'template1' },
  },
  {
    template: 'relType1',
    _id: 'conn-el-target',
    hub: 'hub-el',
    entity: 'targetSharedId-el',
    entityData: { title: 'Target Entity EL', template: 'targetTemplate-el' },
  },
];

describe('formatRelationships', () => {
  it('maps anchored connections to a textReference pointer on the self side', () => {
    expect(formatRelationships('sharedId1', entityWithReferences)).toEqual([
      {
        _id: 'conn2',
        hub: 'hub1',
        type: 'relationshipType1',
        from: {
          type: 'textReference',
          entity: 'sharedId1',
          entityTitle: 'Source Entity',
          entityTemplateId: 'template1',
          file: 'file1',
          text: 'selected text',
          selections: [{ page: 1, top: 10, left: 20, width: 100, height: 30 }],
        },
        to: {
          type: 'entity',
          entity: 'targetSharedId',
          entityTitle: 'Target Entity',
          entityTemplateId: 'targetTemplate1',
        },
        relationTypeOnSelf: true,
      },
      {
        _id: 'conn4',
        hub: 'hub2',
        type: 'relationshipType2',
        from: {
          type: 'textReference',
          entity: 'sharedId1',
          entityTitle: 'Source Entity',
          entityTemplateId: 'template1',
          file: 'file2',
          text: 'another selection',
          selections: [{ page: 2, top: 5, left: 15, width: 80, height: 20 }],
        },
        to: {
          type: 'entity',
          entity: 'anotherSharedId',
          entityTitle: 'Another Target',
          entityTemplateId: 'targetTemplate2',
        },
        relationTypeOnSelf: true,
      },
    ]);
  });

  it('maps entity-level connections to entity pointers on both sides', () => {
    expect(formatRelationships('sharedId-el', entityWithEntityLevelConnections)).toEqual([
      {
        _id: 'conn-el-target',
        hub: 'hub-el',
        type: 'relType1',
        from: {
          type: 'entity',
          entity: 'sharedId-el',
          entityTitle: 'Entity with entity-level connections',
          entityTemplateId: 'template1',
        },
        to: {
          type: 'entity',
          entity: 'targetSharedId-el',
          entityTitle: 'Target Entity EL',
          entityTemplateId: 'targetTemplate-el',
        },
        relationTypeOnSelf: false,
      },
    ]);
  });

  it('marks entity-level links as incoming when the self side carries the type', () => {
    const rows: RelationshipHubRow[] = [
      {
        template: 'replicaType',
        _id: 'conn-in-self',
        hub: 'hub-in',
        entity: 'currentId',
        entityData: { title: 'Current Entity', template: 'template1' },
      },
      {
        template: null,
        _id: 'conn-in-partner',
        hub: 'hub-in',
        entity: 'ext1Id',
        entityData: { title: 'ext1', template: 'extTemplate' },
      },
    ];

    expect(formatRelationships('currentId', rows)).toEqual([
      {
        _id: 'conn-in-partner',
        hub: 'hub-in',
        type: 'replicaType',
        from: {
          type: 'entity',
          entity: 'currentId',
          entityTitle: 'Current Entity',
          entityTemplateId: 'template1',
        },
        to: {
          type: 'entity',
          entity: 'ext1Id',
          entityTitle: 'ext1',
          entityTemplateId: 'extTemplate',
        },
        relationTypeOnSelf: true,
      },
    ]);
  });

  it('skips connections whose hub target has no template (self end)', () => {
    const rows: RelationshipHubRow[] = [
      {
        template: 'relationshipType3',
        _id: 'conn6',
        hub: 'hub4',
        file: 'file3',
        entity: 'sharedId4',
        entityData: { title: 'Entity', template: 'template1' },
        reference: {
          text: 'some text',
          selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, page: '1' }],
        },
      },
      {
        template: null,
        _id: 'conn7',
        hub: 'hub4',
        entity: 'noTemplateSharedId',
        entityData: { title: 'No Template Entity', template: '' },
      },
    ];

    expect(formatRelationships('sharedId4', rows)).toEqual([]);
  });

  it('returns empty array when there are no hub rows', () => {
    expect(formatRelationships('sharedId3', [])).toEqual([]);
  });

  it('returns empty array when no relation pairs with the self side', () => {
    expect(formatRelationships('sharedId2', entityWithNoReferences)).toEqual([]);
  });

  it('excludes self-references where both hub ends belong to the same entity', () => {
    const rows: RelationshipHubRow[] = [
      {
        template: 'relationshipType1',
        _id: 'conn10',
        hub: 'hub6',
        file: 'file4',
        entity: 'sharedId6',
        entityData: { title: 'Self-Referencing Entity', template: 'entityTemplate1' },
        reference: {
          text: 'first selection',
          selectionRectangles: [{ top: 10, left: 20, width: 100, height: 30, page: '3' }],
        },
      },
      {
        template: null,
        _id: 'conn11',
        hub: 'hub6',
        file: 'file4',
        entity: 'sharedId6',
        entityData: { title: 'Self-Referencing Entity', template: 'entityTemplate1' },
        reference: {
          text: 'second selection',
          selectionRectangles: [{ top: 50, left: 20, width: 200, height: 30, page: '1' }],
        },
      },
    ];

    expect(formatRelationships('sharedId6', rows)).toEqual([]);
  });

  it('pairs each target with the self-side hub connection', () => {
    const rows: RelationshipHubRow[] = [
      {
        template: null,
        _id: 'conn-multi-source',
        hub: 'hub-multi',
        entity: 'sharedId-multi',
        entityData: { title: 'Source Entity', template: 'template1' },
      },
      {
        template: 'relType1',
        _id: 'conn-multi-honduras',
        hub: 'hub-multi',
        entity: 'hondurasId',
        entityData: { title: 'Honduras', template: 'countryTemplate' },
      },
      {
        template: 'relType1',
        _id: 'conn-multi-ecuador',
        hub: 'hub-multi',
        entity: 'ecuadorId',
        entityData: { title: 'Ecuador', template: 'countryTemplate' },
      },
      {
        template: 'relType1',
        _id: 'conn-multi-a2',
        hub: 'hub-multi',
        entity: 'a2Id',
        entityData: { title: 'A2', template: 'courtCaseTemplate' },
      },
    ];

    const result = formatRelationships('sharedId-multi', rows);

    expect(result).toHaveLength(3);
    expect(result.map(view => view.to.entityTitle).sort()).toEqual(['A2', 'Ecuador', 'Honduras']);
    result.forEach(view => {
      expect(view.from.entity).toBe('sharedId-multi');
    });
  });

  it('emits one view per hub target', () => {
    const rows: RelationshipHubRow[] = [
      {
        template: 'relationshipType1',
        _id: 'conn-dup-source',
        hub: 'hub-dup',
        file: 'file1',
        entity: 'sharedId-dup',
        entityData: { title: 'Source Entity', template: 'template1' },
        reference: {
          text: 'selected text',
          selectionRectangles: [{ top: 10, left: 20, width: 100, height: 30, page: '1' }],
        },
      },
      {
        template: null,
        _id: 'conn-dup-target',
        hub: 'hub-dup',
        entity: 'targetSharedId',
        entityData: { title: 'Target Entity', template: 'targetTemplate1' },
      },
    ];

    expect(formatRelationships('sharedId-dup', rows)).toHaveLength(1);
  });
});
