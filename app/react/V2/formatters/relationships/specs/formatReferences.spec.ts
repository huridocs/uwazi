import { Entity } from '#V2/api/entities/types.js';
import { formatReferences } from '../formatReferences.js';

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
      _id: 'conn2',
      hub: 'hub1',
      entity: 'targetSharedId',
      entityData: {
        _id: 'targetId',
        title: 'Target Entity',
        template: 'targetTemplate1',
      },
    },
    {
      _id: 'conn3',
      hub: 'hub2',
      file: 'file2',
      entity: 'sharedId1',
      reference: {
        text: 'another selection',
        selectionRectangles: [{ top: 5, left: 15, width: 80, height: 20, page: '2' }],
      },
    },
    {
      _id: 'conn4',
      hub: 'hub2',
      entity: 'anotherSharedId',
      entityData: {
        _id: 'anotherId',
        title: 'Another Target',
        template: 'targetTemplate2',
      },
    },
  ],
} as Entity;

const entityWithNoReferences = {
  _id: 'entity2',
  sharedId: 'sharedId2',
  language: 'en',
  title: 'Entity with no refs',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [
    {
      _id: 'conn5',
      hub: 'hub3',
      entity: 'someSharedId',
      entityData: {
        _id: 'someId',
        title: 'Some Entity',
        template: 'someTemplate',
      },
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

describe('formatReferences', () => {
  it('should format references from entity relations', () => {
    const result = formatReferences(entityWithReferences);

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      _id: 'conn2',
      hub: 'hub1',
      file: 'file1',
      reference: {
        text: 'selected text',
        selectionRectangles: [{ top: 10, left: 20, width: 100, height: 30, page: '1' }],
      },
      targetEntity: {
        _id: 'conn2',
        sharedId: 'targetSharedId',
        title: 'Target Entity',
        templateId: 'targetTemplate1',
      },
    });

    expect(result[1]).toEqual({
      _id: 'conn4',
      hub: 'hub2',
      file: 'file2',
      reference: {
        text: 'another selection',
        selectionRectangles: [{ top: 5, left: 15, width: 80, height: 20, page: '2' }],
      },
      targetEntity: {
        _id: 'conn4',
        sharedId: 'anotherSharedId',
        title: 'Another Target',
        templateId: 'targetTemplate2',
      },
    });
  });

  it('should return an empty array when no relations have a reference property', () => {
    const result = formatReferences(entityWithNoReferences);
    expect(result).toEqual([]);
  });

  it('should return an empty array when entity has no relations', () => {
    const result = formatReferences(entityWithNoRelations);
    expect(result).toEqual([]);
  });

  it('should skip connections whose hub partner has no template', () => {
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
          _id: 'conn7',
          hub: 'hub4',
          entity: 'noTemplateSharedId',
          entityData: { _id: 'noTemplateId', title: 'No Template Entity' },
        },
      ],
    } as unknown as Entity;

    const result = formatReferences(entity);
    expect(result).toEqual([]);
  });

  it('should use an empty string for file when source connection has no file', () => {
    const entity = {
      _id: 'entity5',
      sharedId: 'sharedId5',
      language: 'en',
      title: 'Entity',
      template: 'template1',
      creationDate: 1,
      user: 'user1',
      relations: [
        {
          _id: 'conn8',
          hub: 'hub5',
          entity: 'sharedId5',
          reference: {
            text: 'text without file',
            selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, page: '1' }],
          },
        },
        {
          _id: 'conn9',
          hub: 'hub5',
          entity: 'targetSharedId2',
          entityData: { _id: 'targetId2', title: 'Target 2', template: 'targetTemplate3' },
        },
      ],
    } as unknown as Entity;

    const result = formatReferences(entity);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('');
  });
});
