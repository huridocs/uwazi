import { Entity } from '#V2/api/entities/types.js';
import { buildRelationshipsSsrIndex, UNLABELED_TYPE_ID } from '../buildRelationshipsSsrIndex.js';

const relationshipTypes = [
  { _id: 'relA', name: 'Related' },
  { _id: 'relB', name: 'Mentions' },
];

const entityWithGroupedRelations = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Source',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [
    {
      template: 'relA',
      _id: 'c1',
      hub: 'h1',
      entity: 'shared1',
      entityData: { title: 'Source', template: 'template1' },
    },
    {
      template: null,
      _id: 'c2',
      hub: 'h1',
      entity: 'target-entity',
      entityData: { title: 'Related Entity', template: 'template1' },
    },
    {
      template: 'relA',
      _id: 'c3',
      hub: 'h2',
      entity: 'shared1',
      entityData: { title: 'Source', template: 'template1' },
    },
    {
      template: null,
      _id: 'c4',
      hub: 'h2',
      entity: 'other-entity',
      entityData: { title: 'Other Entity', template: 'template1' },
    },
    {
      template: 'relB',
      _id: 'c5',
      hub: 'h3',
      entity: 'shared1',
      entityData: { title: 'Source', template: 'template1' },
    },
    {
      template: null,
      _id: 'c6',
      hub: 'h3',
      entity: 'mentioned-entity',
      entityData: { title: 'Mentioned Entity', template: 'template1' },
    },
    {
      template: 'relA',
      _id: 'c7',
      hub: 'h4',
      entity: 'shared1',
      entityData: { title: 'Source', template: 'template1' },
    },
    {
      template: null,
      _id: 'c8',
      hub: 'h4',
      entity: 'target-entity',
      entityData: { title: 'Related Entity', template: 'template1' },
    },
  ],
} as Entity;

describe('buildRelationshipsSsrIndex', () => {
  it('groups related entities by relation type and deduplicates within each group', () => {
    expect(buildRelationshipsSsrIndex(entityWithGroupedRelations, relationshipTypes)).toEqual([
      {
        typeId: 'relB',
        typeName: 'Mentions',
        entities: [{ sharedId: 'mentioned-entity', title: 'Mentioned Entity' }],
      },
      {
        typeId: 'relA',
        typeName: 'Related',
        entities: [
          { sharedId: 'other-entity', title: 'Other Entity' },
          { sharedId: 'target-entity', title: 'Related Entity' },
        ],
      },
    ]);
  });

  it('keeps unlabeled types last and skips the current entity', () => {
    const entity = {
      ...entityWithGroupedRelations,
      relations: [
        {
          template: null,
          _id: 'self',
          hub: 'h5',
          entity: 'shared1',
          entityData: { title: 'Source', template: 'template1' },
        },
        {
          template: null,
          _id: 'unlabeled',
          hub: 'h5',
          entity: 'plain-entity',
          entityData: { title: 'Plain Entity', template: 'template1' },
        },
        ...(entityWithGroupedRelations.relations ?? []),
      ],
    } as Entity;

    const groups = buildRelationshipsSsrIndex(entity, relationshipTypes);

    expect(groups.map(group => group.typeId)).toEqual(['relB', 'relA', UNLABELED_TYPE_ID]);
    expect(groups[2]).toEqual({
      typeId: UNLABELED_TYPE_ID,
      typeName: '',
      entities: [{ sharedId: 'plain-entity', title: 'Plain Entity' }],
    });
  });

  it('returns an empty list when the entity has no relationships', () => {
    expect(
      buildRelationshipsSsrIndex(
        { ...entityWithGroupedRelations, relations: undefined },
        relationshipTypes
      )
    ).toEqual([]);
  });
});
