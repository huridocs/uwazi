import { Entity } from 'api/core/domain/entity/Entity';
import { TemplateBuilder } from '../../template/specs/TemplateBuilder';
import { TextProperty } from '../../template/TextProperty';
import { NumericProperty } from '../../template/NumericProperty';
import { EntityTranslation } from '../EntityTranslation';

const createSampleTemplate = () =>
  TemplateBuilder.aTemplate({ id: 'template-123' })
    .withProperties([
      new TextProperty({
        id: 'description',
        template: 'template-123',
        label: 'Description',
      }),
      new NumericProperty({
        id: 'age',
        template: 'template-123',
        label: 'Age',
      }),
    ])
    .build();

describe('Entity', () => {
  it('should create an Entity in multiple languages', () => {
    const template = createSampleTemplate();

    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template,
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    const entityLanguage = new EntityTranslation({
      id: 'id-789',
      metadata: template.createDefaultPropertyValues(),
      language: 'en',
    });

    expect(entity.sharedId).toEqual(expect.any(String));
    expect(entity.published).toBe(false);
    expect(entity.userId).toBe('user-456');
    expect(entity.translations).toEqual({
      en: entityLanguage,
      es: { ...entityLanguage, language: 'es' },
      fr: { ...entityLanguage, language: 'fr' },
    });
  });

  it('should set values in all languages when no language is specified', () => {
    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setValues([
      {
        name: 'description',
        type: 'text',
        value: [{ value: 'A description in multiple languages' }],
      },
      {
        name: 'age',
        type: 'numeric',
        value: [{ value: 42 }],
      },
    ]);

    const entityLanguage = new EntityTranslation({
      id: 'id-789',
      language: 'en',
      metadata: {
        ...entity.template.createDefaultPropertyValues(),
        description: {
          name: 'description',
          value: [{ value: 'A description in multiple languages' }],
          type: 'text',
        },
        age: { name: 'age', value: [{ value: 42 }], type: 'numeric' },
        editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
      },
    });

    expect(entity.translations).toEqual({
      en: entityLanguage,
      es: { ...entityLanguage, language: 'es' },
      fr: { ...entityLanguage, language: 'fr' },
    });
  });

  it('should allow partial updates when setting values', () => {
    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setValues([
      {
        name: 'age',
        type: 'numeric',
        value: [{ value: 42 }],
      },
    ]);

    entity.setValues([
      {
        name: 'description',
        type: 'text',
        value: [{ value: 'A description in multiple languages' }],
      },
    ]);

    const entityLanguage = new EntityTranslation({
      id: 'id-789',
      language: 'en',
      metadata: {
        creationDate: {
          name: 'creationDate',
          value: [{ value: expect.any(Number) }],
          type: 'date',
        },
        description: {
          name: 'description',
          value: [{ value: 'A description in multiple languages' }],
          type: 'text',
        },
        age: { name: 'age', value: [{ value: 42 }], type: 'numeric' },

        title: { name: 'title', value: [], type: 'text' },
        editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
      },
    });

    expect(entity.translations).toEqual({
      en: entityLanguage,
      es: { ...entityLanguage, language: 'es' },
      fr: { ...entityLanguage, language: 'fr' },
    });
  });

  it('should set values in a specific language', () => {
    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setValues(
      [
        {
          name: 'title',
          type: 'text',
          value: [{ value: 'A title in English' }],
        },
        {
          name: 'description',
          type: 'text',
          value: [{ value: 'A description in English' }],
        },
        {
          name: 'age',
          type: 'numeric',
          value: [{ value: 42 }],
        },
      ],
      'en'
    );

    entity.setValues(
      [
        {
          name: 'title',
          type: 'text',
          value: [{ value: 'A title in Spanish' }],
        },
        {
          name: 'description',
          type: 'text',
          value: [{ value: 'A description in Spanish' }],
        },
      ],
      'es'
    );

    entity.setValues(
      [
        {
          name: 'title',
          type: 'text',
          value: [{ value: 'A title in French' }],
        },
        {
          name: 'description',
          type: 'text',
          value: [{ value: 'A description in French' }],
        },
      ],
      'fr'
    );

    expect(entity.getTranslation('en')).toEqual({
      id: 'id-789',
      language: 'en',
      metadata: {
        title: { name: 'title', value: [{ value: 'A title in English' }], type: 'text' },
        description: {
          name: 'description',
          value: [{ value: 'A description in English' }],
          type: 'text',
        },
        age: { name: 'age', value: [{ value: 42 }], type: 'numeric' },

        creationDate: {
          name: 'creationDate',
          value: [{ value: expect.any(Number) }],
          type: 'date',
        },
        editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
      },
    });

    expect(entity.getTranslation('fr')).toEqual({
      id: 'id-789',
      language: 'fr',
      metadata: {
        title: { name: 'title', value: [{ value: 'A title in French' }], type: 'text' },
        description: {
          name: 'description',
          value: [{ value: 'A description in French' }],
          type: 'text',
        },
        age: { name: 'age', value: [{ value: 42 }], type: 'numeric' },

        creationDate: {
          name: 'creationDate',
          value: [{ value: expect.any(Number) }],
          type: 'date',
        },
        editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
      },
    });

    expect(entity.getTranslation('es')).toEqual({
      id: 'id-789',
      language: 'es',
      metadata: {
        title: { name: 'title', value: [{ value: 'A title in Spanish' }], type: 'text' },
        description: {
          name: 'description',
          value: [{ value: 'A description in Spanish' }],
          type: 'text',
        },
        age: { name: 'age', value: [{ value: 42 }], type: 'numeric' },

        creationDate: {
          name: 'creationDate',
          value: [{ value: expect.any(Number) }],
          type: 'date',
        },
        editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
      },
    });
  });
});
