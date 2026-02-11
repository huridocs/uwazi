/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { MongoEntityMapper } from '../entity/MongoEntityMapper';

const factory = getFixturesFactory();

describe('TemplateMapper', () => {
  const templateDbo = factory.template('sample_template', [
    { _id: new ObjectId(), label: 'date', name: 'date', type: 'date' },
    { _id: new ObjectId(), label: 'daterange', name: 'daterange', type: 'daterange' },
    {
      _id: new ObjectId(),
      label: 'geolocation',
      name: 'geolocation_geolocation',
      type: 'geolocation',
    },
    { _id: new ObjectId(), label: 'image', name: 'image', type: 'image' },
    { _id: new ObjectId(), label: 'link', name: 'link', type: 'link' },
    { _id: new ObjectId(), label: 'markdown', name: 'markdown', type: 'markdown' },
    { _id: new ObjectId(), label: 'media', name: 'media', type: 'media' },
    { _id: new ObjectId(), label: 'multidate', name: 'multidate', type: 'multidate' },
    {
      _id: new ObjectId(),
      label: 'multidaterange',
      name: 'multidaterange',
      type: 'multidaterange',
    },
    {
      _id: new ObjectId(),
      label: 'multiselect',
      name: 'multiselect',
      type: 'multiselect',
      content: 'thesaurus',
    },
    { _id: new ObjectId(), label: 'nested', name: 'nested', type: 'nested' },
    { _id: new ObjectId(), label: 'numeric', name: 'numeric', type: 'numeric' },
    { _id: new ObjectId(), label: 'preview', name: 'preview', type: 'preview' },
    { _id: new ObjectId(), label: 'relationship', name: 'relationship', type: 'relationship' },
    {
      _id: new ObjectId(),
      label: 'select',
      name: 'select',
      type: 'select',
      content: 'thesaurus',
    },
    { _id: new ObjectId(), label: 'text', name: 'text', type: 'text' },
    { _id: new ObjectId(), label: 'generatedid', name: 'generatedid', type: 'generatedid' },
  ]);

  const createEntitiesDBO = () =>
    factory.entityInMultipleLanguages(
      ['en', 'es'],
      'sample_entity',
      'sample_template',
      {
        date: [{ value: 1000000 }],
        daterange: [{ value: { from: 1000000, to: 2000000 } }],
        geolocation_geolocation: [{ value: { lat: 10, lon: 20 } }],
        image: [{ value: 'image1.jpg' }],
        link: [{ value: { url: 'http://example.com', label: 'Label' } }],
        markdown: [{ value: 'Some **markdown** content' }],
        multidate: [{ value: 1000000 }, { value: 1000000 }],
        multidaterange: [
          { value: { from: 1000000, to: 2000000 } },
          { value: { from: 3000000, to: 4000000 } },
        ],
        multiselect: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ],
        numeric: [{ value: 42 }],
        relationship: [
          {
            value: 'shared_id',
            type: 'entity',
            label: 'Related Entity',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Some text' }],
          },
        ],
        select: [{ value: 'option1', label: 'Option 1' }],
        text: [{ value: 'Some text content' }],
        generatedid: [{ value: 'gen-12345' }],
        nested: [],
        preview: [],
        media: [],
      },
      {
        creationDate: 1000000,
        editDate: 2000000,
        published: true,
        icon: { _id: 'icon_id', label: 'Icon Label', type: 'icon' },
        user: factory.id('user_id'),
        obsoleteMetadata: [],
        permissions: [],
        generatedToc: true,
      }
    );

  it('should map to domain correctly', () => {
    const entities = createEntitiesDBO();
    const result = MongoEntityMapper.toDomain(entities as any[], templateDbo as any);

    expect(result.translations).toEqual({
      en: {
        id: { value: expect.any(String) },
        language: 'en',
        metadata: {
          title: {
            name: 'title',
            value: [{ value: 'sample_entity' }],
            type: 'text',
            isTranslatable: true,
          },
          creationDate: {
            name: 'creationDate',
            value: [{ value: 1000000 }],
            type: 'date',
            isTranslatable: false,
          },
          editDate: {
            name: 'editDate',
            value: [{ value: 2000000 }],
            type: 'date',
            isTranslatable: false,
          },
          date: {
            value: [{ value: 1000000 }],
            name: 'date',
            type: 'date',
            language: 'en',
            isTranslatable: false,
          },
          daterange: {
            value: [{ value: { from: 1000000, to: 2000000 } }],
            name: 'daterange',
            type: 'daterange',
            language: 'en',
            isTranslatable: false,
          },
          geolocation_geolocation: {
            value: [{ value: { lat: 10, lon: 20 } }],
            name: 'geolocation_geolocation',
            type: 'geolocation',
            language: 'en',
            isTranslatable: false,
          },
          image: {
            value: [{ value: 'image1.jpg' }],
            name: 'image',
            type: 'image',
            language: 'en',
            isTranslatable: true,
          },
          link: {
            value: [{ value: { url: 'http://example.com', label: 'Label' } }],
            name: 'link',
            type: 'link',
            language: 'en',
            isTranslatable: true,
          },
          markdown: {
            value: [{ value: 'Some **markdown** content' }],
            name: 'markdown',
            type: 'markdown',
            language: 'en',
            isTranslatable: true,
          },
          media: { value: [], name: 'media', type: 'media', language: 'en', isTranslatable: true },
          multidate: {
            value: [{ value: 1000000 }, { value: 1000000 }],
            name: 'multidate',
            type: 'multidate',
            language: 'en',
            isTranslatable: false,
          },
          multidaterange: {
            value: [
              { value: { from: 1000000, to: 2000000 } },
              { value: { from: 3000000, to: 4000000 } },
            ],
            name: 'multidaterange',
            type: 'multidaterange',
            language: 'en',
            isTranslatable: false,
          },
          multiselect: {
            value: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ],
            name: 'multiselect',
            type: 'multiselect',
            language: 'en',
            isTranslatable: false,
          },
          nested: {
            value: [],
            name: 'nested',
            type: 'nested',
            language: 'en',
            isTranslatable: false,
          },
          numeric: {
            value: [{ value: 42 }],
            name: 'numeric',
            type: 'numeric',
            language: 'en',
            isTranslatable: false,
          },
          preview: {
            value: [],
            name: 'preview',
            type: 'preview',
            language: 'en',
            isTranslatable: true,
          },
          relationship: {
            value: [
              {
                value: 'shared_id',
                type: 'entity',
                label: 'Related Entity',
                inheritedType: 'text',
                inheritedValue: [{ value: 'Some text' }],
              },
            ],
            name: 'relationship',
            type: 'relationship',
            language: 'en',
            isTranslatable: false,
          },
          select: {
            value: [{ value: 'option1', label: 'Option 1' }],
            name: 'select',
            type: 'select',
            language: 'en',
            isTranslatable: false,
          },
          text: {
            value: [{ value: 'Some text content' }],
            name: 'text',
            type: 'text',
            language: 'en',
            isTranslatable: true,
          },
          generatedid: {
            value: [{ value: 'gen-12345' }],
            name: 'generatedid',
            type: 'generatedid',
            language: 'en',
            isTranslatable: false,
          },
        },
      },
      es: {
        id: { value: expect.any(String) },
        language: 'es',
        metadata: {
          title: {
            name: 'title',
            value: [{ value: 'sample_entity' }],
            type: 'text',
            isTranslatable: true,
          },
          creationDate: {
            name: 'creationDate',
            value: [{ value: 1000000 }],
            type: 'date',
            isTranslatable: false,
          },
          editDate: {
            name: 'editDate',
            value: [{ value: 2000000 }],
            type: 'date',
            isTranslatable: false,
          },
          date: {
            value: [{ value: 1000000 }],
            name: 'date',
            type: 'date',
            language: 'es',
            isTranslatable: false,
          },
          daterange: {
            value: [{ value: { from: 1000000, to: 2000000 } }],
            name: 'daterange',
            type: 'daterange',
            language: 'es',
            isTranslatable: false,
          },
          geolocation_geolocation: {
            value: [{ value: { lat: 10, lon: 20 } }],
            name: 'geolocation_geolocation',
            type: 'geolocation',
            language: 'es',
            isTranslatable: false,
          },
          image: {
            value: [{ value: 'image1.jpg' }],
            name: 'image',
            type: 'image',
            language: 'es',
            isTranslatable: true,
          },
          link: {
            value: [{ value: { url: 'http://example.com', label: 'Label' } }],
            name: 'link',
            type: 'link',
            language: 'es',
            isTranslatable: true,
          },
          markdown: {
            value: [{ value: 'Some **markdown** content' }],
            name: 'markdown',
            type: 'markdown',
            language: 'es',
            isTranslatable: true,
          },
          media: { value: [], name: 'media', type: 'media', language: 'es', isTranslatable: true },
          multidate: {
            value: [{ value: 1000000 }, { value: 1000000 }],
            name: 'multidate',
            type: 'multidate',
            language: 'es',
            isTranslatable: false,
          },
          multidaterange: {
            value: [
              { value: { from: 1000000, to: 2000000 } },
              { value: { from: 3000000, to: 4000000 } },
            ],
            name: 'multidaterange',
            type: 'multidaterange',
            language: 'es',
            isTranslatable: false,
          },
          multiselect: {
            value: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ],
            name: 'multiselect',
            type: 'multiselect',
            language: 'es',
            isTranslatable: false,
          },
          nested: {
            value: [],
            name: 'nested',
            type: 'nested',
            language: 'es',
            isTranslatable: false,
          },
          numeric: {
            value: [{ value: 42 }],
            name: 'numeric',
            type: 'numeric',
            language: 'es',
            isTranslatable: false,
          },
          preview: {
            value: [],
            name: 'preview',
            type: 'preview',
            language: 'es',
            isTranslatable: true,
          },
          relationship: {
            value: [
              {
                value: 'shared_id',
                type: 'entity',
                label: 'Related Entity',
                inheritedType: 'text',
                inheritedValue: [{ value: 'Some text' }],
              },
            ],
            name: 'relationship',
            type: 'relationship',
            language: 'es',
            isTranslatable: false,
          },
          select: {
            value: [{ value: 'option1', label: 'Option 1' }],
            name: 'select',
            type: 'select',
            language: 'es',
            isTranslatable: false,
          },
          text: {
            value: [{ value: 'Some text content' }],
            name: 'text',
            type: 'text',
            language: 'es',
            isTranslatable: true,
          },
          generatedid: {
            value: [{ value: 'gen-12345' }],
            name: 'generatedid',
            type: 'generatedid',
            language: 'es',
            isTranslatable: false,
          },
        },
      },
    });

    expect(result.sharedId).toBe('sample_entity');
    expect(result.userId).toBe(factory.id('user_id').toString());
    expect(result.published).toBe(true);
    expect(result.generatedToc).toBe(true);
    expect(result.icon).toEqual({ id: 'icon_id', label: 'Icon Label', type: 'icon' });

    // Icon removed
    entities.forEach(e => (e.icon = { _id: null, label: undefined, type: 'Empty' }));

    const resultNoIcon = MongoEntityMapper.toDomain(entities as any[], templateDbo as any);

    expect(resultNoIcon.icon).toBeUndefined();
  });

  it('should map to DBO correctly', () => {
    const entities = createEntitiesDBO();
    const entitiesDomain = MongoEntityMapper.toDomain(entities as any[], templateDbo as any);
    const entitiesMapped = MongoEntityMapper.toDBO(entitiesDomain);

    expect(entitiesMapped).toEqual(entities);

    entitiesDomain.update({ icon: undefined });

    const resultNoIcon = MongoEntityMapper.toDBO(entitiesDomain);

    expect(resultNoIcon.map(e => e.icon)).toEqual([
      { _id: null, label: undefined, type: 'Empty' },
      { _id: null, label: undefined, type: 'Empty' },
    ]);
  });

  describe('Permissions mapping', () => {
    it('should map permissions from DBO to domain', () => {
      const userId = factory.id('user1');
      const groupId = factory.id('group1');

      const entitiesWithPermissions = factory.entityInMultipleLanguages(
        ['en'],
        'entity_with_permissions',
        'sample_template',
        {},
        {
          creationDate: 1000000,
          editDate: 2000000,
          published: false,
          user: userId,
          permissions: [
            { refId: userId, type: 'user', level: 'write' },
            { refId: groupId, type: 'group', level: 'read' },
          ],
        }
      );

      const result = MongoEntityMapper.toDomain(
        entitiesWithPermissions as any[],
        templateDbo as any
      );

      expect(result.permissions.accessGrants).toHaveLength(2);
      expect(result.permissions.accessGrants[0]).toEqual({
        refId: userId.toHexString(),
        type: 'user',
        level: 'write',
      });
      expect(result.permissions.accessGrants[1]).toEqual({
        refId: groupId.toHexString(),
        type: 'group',
        level: 'read',
      });
    });

    it('should handle entities without permissions', () => {
      const entitiesWithoutPermissions = factory.entityInMultipleLanguages(
        ['en'],
        'entity_without_permissions',
        'sample_template',
        {},
        {
          creationDate: 1000000,
          editDate: 2000000,
          published: true,
        }
      );

      const result = MongoEntityMapper.toDomain(
        entitiesWithoutPermissions as any[],
        templateDbo as any
      );

      expect(result.permissions.accessGrants).toEqual([]);
    });

    it('should map permissions from domain to DBO', () => {
      const userId = factory.id('user1');
      const groupId = factory.id('group1');

      const entitiesWithPermissions = factory.entityInMultipleLanguages(
        ['en', 'es'],
        'entity_with_permissions',
        'sample_template',
        {},
        {
          creationDate: 1000000,
          editDate: 2000000,
          published: false,
          user: userId,
          permissions: [
            { refId: userId, type: 'user', level: 'write' },
            { refId: groupId, type: 'group', level: 'read' },
          ],
        }
      );

      const entity = MongoEntityMapper.toDomain(
        entitiesWithPermissions as any[],
        templateDbo as any
      );
      const mappedDbo = MongoEntityMapper.toDBO(entity);

      expect(mappedDbo[0].permissions).toHaveLength(2);
      expect(mappedDbo[0].permissions![0]).toEqual({
        refId: userId.toHexString(),
        type: 'user',
        level: 'write',
      });
      expect(mappedDbo[0].permissions![1]).toEqual({
        refId: groupId.toHexString(),
        type: 'group',
        level: 'read',
      });

      // Both language variants should have the same permissions
      expect(mappedDbo[1].permissions).toEqual(mappedDbo[0].permissions);
    });

    it('should round-trip permissions correctly', () => {
      const userId = factory.id('user1');
      const groupId = factory.id('group1');

      const originalEntities = factory.entityInMultipleLanguages(
        ['en', 'es'],
        'entity_roundtrip',
        'sample_template',
        {},
        {
          creationDate: 1000000,
          editDate: 2000000,
          published: false,
          user: userId,
          permissions: [
            { refId: userId.toHexString(), type: 'user', level: 'write' },
            { refId: groupId.toHexString(), type: 'group', level: 'read' },
          ],
        }
      );

      const entity = MongoEntityMapper.toDomain(originalEntities as any[], templateDbo as any);
      const mappedBack = MongoEntityMapper.toDBO(entity);

      expect(mappedBack[0].permissions).toEqual(originalEntities[0].permissions);
      expect(mappedBack[1].permissions).toEqual(originalEntities[1].permissions);
    });
  });
});
