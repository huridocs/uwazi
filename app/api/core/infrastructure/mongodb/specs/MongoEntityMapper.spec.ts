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

  const entitiesDbo = factory.entityInMultipleLanguages(
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
    }
  );

  it('should map to domain correctly', () => {
    const result = MongoEntityMapper.toDomain(entitiesDbo as any[], templateDbo as any);

    expect(result.translations).toEqual({
      en: {
        id: expect.any(String),
        language: 'en',
        metadata: {
          nested: { type: 'nested', name: 'nested', value: [], language: 'en' },
          preview: { type: 'preview', name: 'preview', value: [], language: 'en' },
          media: { type: 'media', name: 'media', value: [], language: 'en' },

          title: { name: 'title', value: [{ value: 'sample_entity' }], type: 'text' },
          creationDate: { name: 'creationDate', value: [{ value: 1000000 }], type: 'date' },
          editDate: { name: 'editDate', value: [{ value: 2000000 }], type: 'date' },
          date: {
            value: [{ value: 1000000 }],
            name: 'date',
            type: 'date',
            language: 'en',
          },
          daterange: {
            value: [{ value: { from: 1000000, to: 2000000 } }],
            name: 'daterange',
            type: 'daterange',
            language: 'en',
          },
          geolocation_geolocation: {
            value: [{ value: { lat: 10, lon: 20 } }],
            name: 'geolocation_geolocation',
            type: 'geolocation',
            language: 'en',
          },
          image: {
            value: [{ value: 'image1.jpg' }],
            name: 'image',
            type: 'image',
            language: 'en',
          },
          link: {
            value: [{ value: { url: 'http://example.com', label: 'Label' } }],
            name: 'link',
            type: 'link',
            language: 'en',
          },
          markdown: {
            value: [{ value: 'Some **markdown** content' }],
            name: 'markdown',
            type: 'markdown',
            language: 'en',
          },
          multidate: {
            value: [{ value: 1000000 }, { value: 1000000 }],
            name: 'multidate',
            type: 'multidate',
            language: 'en',
          },
          multidaterange: {
            value: [
              { value: { from: 1000000, to: 2000000 } },
              { value: { from: 3000000, to: 4000000 } },
            ],
            name: 'multidaterange',
            type: 'multidaterange',
            language: 'en',
          },
          multiselect: {
            value: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ],
            name: 'multiselect',
            type: 'multiselect',
            language: 'en',
          },
          numeric: {
            value: [{ value: 42 }],
            name: 'numeric',
            type: 'numeric',
            language: 'en',
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
          },
          select: {
            value: [{ value: 'option1', label: 'Option 1' }],
            name: 'select',
            type: 'select',
            language: 'en',
          },
          text: {
            value: [{ value: 'Some text content' }],
            name: 'text',
            type: 'text',
            language: 'en',
          },
          generatedid: {
            value: [{ value: 'gen-12345' }],
            name: 'generatedid',
            type: 'generatedid',
            language: 'en',
          },
        },
      },
      es: {
        id: expect.any(String),
        language: 'es',
        metadata: {
          nested: { type: 'nested', name: 'nested', value: [], language: 'es' },
          preview: { type: 'preview', name: 'preview', value: [], language: 'es' },
          media: { type: 'media', name: 'media', value: [], language: 'es' },
          title: { name: 'title', value: [{ value: 'sample_entity' }], type: 'text' },
          creationDate: { name: 'creationDate', value: [{ value: 1000000 }], type: 'date' },
          editDate: { name: 'editDate', value: [{ value: 2000000 }], type: 'date' },
          date: {
            value: [{ value: 1000000 }],
            name: 'date',
            type: 'date',
            language: 'es',
          },
          daterange: {
            value: [{ value: { from: 1000000, to: 2000000 } }],
            name: 'daterange',
            type: 'daterange',
            language: 'es',
          },
          geolocation_geolocation: {
            value: [{ value: { lat: 10, lon: 20 } }],
            name: 'geolocation_geolocation',
            type: 'geolocation',
            language: 'es',
          },
          image: {
            value: [{ value: 'image1.jpg' }],
            name: 'image',
            type: 'image',
            language: 'es',
          },
          link: {
            value: [{ value: { url: 'http://example.com', label: 'Label' } }],
            name: 'link',
            type: 'link',
            language: 'es',
          },
          markdown: {
            value: [{ value: 'Some **markdown** content' }],
            name: 'markdown',
            type: 'markdown',
            language: 'es',
          },
          multidate: {
            value: [{ value: 1000000 }, { value: 1000000 }],
            name: 'multidate',
            type: 'multidate',
            language: 'es',
          },
          multidaterange: {
            value: [
              { value: { from: 1000000, to: 2000000 } },
              { value: { from: 3000000, to: 4000000 } },
            ],
            name: 'multidaterange',
            type: 'multidaterange',
            language: 'es',
          },
          multiselect: {
            value: [
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
            ],
            name: 'multiselect',
            type: 'multiselect',
            language: 'es',
          },
          numeric: {
            value: [{ value: 42 }],
            name: 'numeric',
            type: 'numeric',
            language: 'es',
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
          },
          select: {
            value: [{ value: 'option1', label: 'Option 1' }],
            name: 'select',
            type: 'select',
            language: 'es',
          },
          text: {
            value: [{ value: 'Some text content' }],
            name: 'text',
            type: 'text',
            language: 'es',
          },
          generatedid: {
            value: [{ value: 'gen-12345' }],
            name: 'generatedid',
            type: 'generatedid',
            language: 'es',
          },
        },
      },
    });

    expect(result.sharedId).toBe('sample_entity');
    expect(result.userId).toBe(factory.id('user_id').toString());
    expect(result.published).toBe(true);
    expect(result.icon).toEqual({ id: 'icon_id', label: 'Icon Label', type: 'icon' });
  });

  it('should map to DBO correctly', () => {
    const entitiesMapped = MongoEntityMapper.toDBO(
      MongoEntityMapper.toDomain(entitiesDbo as any[], templateDbo as any)
    );

    expect(entitiesMapped).toEqual(entitiesDbo);
  });
});
