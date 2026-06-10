import { Entity } from '#V2/api/entities/types.js';
import { formatRelationships } from '../formatRelationships.js';

const entityWithReferences = {
  _id: 'entity1',
  sharedId: 'sharedId1',
  language: 'en',
  title: 'Source Entity',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [
    {
      template: 'relationshipType1',
      _id: 'conn1',
      hub: 'hub1',
      file: 'file1',
      entity: 'sharedId1',
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
      entityData: { _id: 'targetId', title: 'Target Entity', template: 'targetTemplate1' },
    },
  ],
} as Entity;

const entityWithEntityLevelConnections = {
  _id: 'entity-el',
  sharedId: 'sharedId-el',
  language: 'en',
  title: 'Entity with entity-level connections',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [
    { template: null, _id: 'conn-el-source', hub: 'hub-el', entity: 'sharedId-el' },
    {
      template: 'relType1',
      _id: 'conn-el-target',
      hub: 'hub-el',
      entity: 'targetSharedId-el',
      entityData: { _id: 'targetId-el', title: 'Target Entity EL', template: 'targetTemplate-el' },
    },
  ],
} as Entity;

const entityWithNoRelations = {
  _id: 'entity3',
  sharedId: 'sharedId3',
  language: 'en',
  title: 'Entity with no relations',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
} as Entity;

describe('formatRelationships', () => {
  it('maps anchored connections to a textReference pointer on the self side', () => {
    const result = formatRelationships(entityWithReferences);

    expect(result).toEqual([
      {
        _id: 'conn2',
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
      },
    ]);
  });

  it('maps entity-level connections to entity pointers on both sides', () => {
    const result = formatRelationships(entityWithEntityLevelConnections);

    expect(result).toEqual([
      {
        _id: 'conn-el-target',
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
      },
    ]);
  });

  it('skips connections whose hub target has no template (self end)', () => {
    const entity = {
      _id: 'entity4',
      sharedId: 'sharedId4',
      language: 'en',
      title: 'Entity',
      template: 'template1',
      creationDate: 1,
      user: 'user1',
      relations: [
        {
          template: 'relationshipType3',
          _id: 'conn6',
          hub: 'hub4',
          file: 'file3',
          entity: 'sharedId4',
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
          entityData: { _id: 'noTemplateId', title: 'No Template Entity' },
        },
      ],
    } as Entity;

    expect(formatRelationships(entity)).toEqual([]);
  });

  it('returns empty array when entity has no relations', () => {
    expect(formatRelationships(entityWithNoRelations)).toEqual([]);
  });
});
