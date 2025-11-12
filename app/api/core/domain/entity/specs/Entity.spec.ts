/* eslint-disable max-statements */
import { Entity } from 'api/core/domain/entity/Entity';
import { TemplateBuilder } from '../../template/specs/TemplateBuilder';
import { TextProperty } from '../../template/TextProperty';
import { NumericProperty } from '../../template/NumericProperty';
import { DateProperty } from '../../template/DateProperty';
import { DateRangeProperty } from '../../template/DateRangeProperty';
import { MultiDateProperty } from '../../template/MultiDateProperty';
import { MultiDateRangeProperty } from '../../template/MultiDateRangeProperty';
import { SelectProperty } from '../../template/select/SelectProperty';
import { MultiSelectProperty } from '../../template/select/MultiSelectProperty';
import { GeolocationProperty } from '../../template/GeoLocationProperty';
import { LinkProperty } from '../../template/LinkProperty';
import { MarkdownProperty } from '../../template/MarkdownProperty';
import { ImageProperty } from '../../template/ImageProperty';
import { MediaProperty } from '../../template/MediaProperty';
import { PreviewProperty } from '../../template/PreviewProperty';
import { NestedProperty } from '../../template/NestedProperty';
import { V1RelationshipProperty } from '../../template/V1RelationshipProperty';
import { EntityTranslation } from '../EntityTranslation';
import { GenerateIdProperty } from '../../template/GenerateIdProperty';

const createSampleTemplate = () =>
  TemplateBuilder.aTemplate({ id: 'template-123' })
    .withProperties([
      new TextProperty({
        id: 'text',
        template: 'template-123',
        label: 'Text',
      }),
      new NumericProperty({
        id: 'numeric',
        template: 'template-123',
        label: 'Numeric',
      }),
      new DateProperty({
        id: 'date',
        label: 'Date',
        template: 'template-123',
      }),
      new DateRangeProperty({
        id: 'dateRange',
        label: 'Date Range',
        template: 'template-123',
      }),
      new GeolocationProperty({
        id: 'geolocation',
        label: 'Geolocation',
        template: 'template-123',
      }),
      new ImageProperty({
        id: 'image',
        label: 'Image',
        template: 'template-123',
      }),
      new LinkProperty({
        id: 'link',
        label: 'Link',
        template: 'template-123',
      }),
      new MarkdownProperty({
        id: 'markdown',
        label: 'Markdown',
        template: 'template-123',
      }),
      new MediaProperty({
        id: 'media',
        label: 'Media',
        template: 'template-123',
      }),
      new MultiDateProperty({
        id: 'multidate',
        label: 'Multi Date',
        template: 'template-123',
      }),
      new MultiDateRangeProperty({
        id: 'multidaterange',
        label: 'Multi Date Range',
        template: 'template-123',
      }),
      new MultiSelectProperty({
        id: 'multiselect',
        label: 'Multi Select',
        template: 'template-123',
        content: 'thes-123',
      }),
      new NestedProperty({
        id: 'nested',
        label: 'Nested',
        template: 'template-123',
      }),
      new PreviewProperty({
        id: 'preview',
        label: 'Preview',
        template: 'template-123',
      }),
      V1RelationshipProperty.create({
        id: 'relationship',
        label: 'Relationship',
        relationType: 'rel-type-123',
        template: 'template-123',
      }),
      new SelectProperty({
        id: 'select',
        label: 'Select',
        template: 'template-123',
        content: 'thes-123',
      }),
      new GenerateIdProperty({
        id: 'generatedid',
        label: 'Generated ID',
        template: 'template-123',
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
      metadata: template.createDefaultPropertyAssignments(),
      language: 'en',
    });

    expect(entity.sharedId).toEqual(expect.any(String));
    expect(entity.published).toBe(false);
    expect(entity.userId).toBe('user-456');
    expect(entity.getTranslation('en').creationDate.value[0].value).toEqual(expect.any(Number));

    expect(entity.translations).toEqual({
      en: entityLanguage,
      es: { ...entityLanguage, language: 'es' },
      fr: { ...entityLanguage, language: 'fr' },
    });
  });

  it('should sync values in all languages when no language is specified', () => {
    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments([
      entity.template.createPropertyAssignment('text', {
        value: [{ value: 'A description in multiple languages' }],
      }),

      entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),

      entity.template.createPropertyAssignment('date', {
        value: [{ value: 1609459200000 }],
      }),

      entity.template.createPropertyAssignment('date_range', {
        value: [{ value: { from: 1609459200000, to: 1612137600000 } }],
      }),

      entity.template.createPropertyAssignment('geolocation_geolocation', {
        value: [{ value: { lat: 48.8566, lon: 2.3522, label: 'Paris' } }],
      }),

      entity.template.createPropertyAssignment('image', {
        value: [{ value: '/api/files/image.jpg' }],
      }),

      entity.template.createPropertyAssignment('link', {
        value: [{ value: { url: 'https://example.com', label: 'Example' } }],
      }),

      entity.template.createPropertyAssignment('markdown', {
        value: [{ value: '<p>A description in multiple languages</p>' }],
      }),

      entity.template.createPropertyAssignment('multi_date', {
        value: [{ value: 1609459200000 }, { value: 1612137600000 }],
      }),

      entity.template.createPropertyAssignment('multi_date_range', {
        value: [
          { value: { from: 1609459200000, to: 1612137600000 } },
          { value: { from: 1609459200000, to: 1612137600000 } },
        ],
      }),

      entity.template.createPropertyAssignment('multi_select', {
        value: [
          { value: 'tag1', label: 'Tag One' },
          { value: 'tag2', label: 'Tag Two' },
        ],
        language: 'en',
      }),
      entity.template.createPropertyAssignment('multi_select', {
        value: [
          { value: 'tag1', label: 'Tag Uno' },
          { value: 'tag2', label: 'Tag Dos' },
        ],
        language: 'es',
      }),
      entity.template.createPropertyAssignment('multi_select', {
        value: [
          { value: 'tag1', label: 'Tag Un' },
          { value: 'tag2', label: 'Tag Deux' },
        ],
        language: 'fr',
      }),

      entity.template.createPropertyAssignment('select', {
        value: [{ value: 'us', label: 'United States' }],
        language: 'en',
      }),

      entity.template.createPropertyAssignment('select', {
        value: [{ value: 'us', label: 'États-Unis' }],
        language: 'fr',
      }),
      entity.template.createPropertyAssignment('select', {
        value: [{ value: 'us', label: 'Estados Unidos' }],
        language: 'es',
      }),

      entity.template.createPropertyAssignment('generated_id', {
        value: [{ value: 'ADSAD-231' }],
      }),

      // entity.template.createPropertyAssignment('media', {
      //   value: [{ value: '<p>A description in multiple languages</p>' }],
      // }),

      // entity.template.createPropertyAssignment('nested', {
      //   value: [
      //     {
      //       value: {
      //         key1: [{ value: 'value1' }],
      //         key2: [{ value: 'value2' }],
      //       },
      //     },
      //   ],
      // }),
    ]);

    expect(entity.getPropertyAssignments('text').map(item => item.value)).toEqual([
      [{ value: 'A description in multiple languages' }],
      [{ value: 'A description in multiple languages' }],
      [{ value: 'A description in multiple languages' }],
    ]);

    expect(entity.getPropertyAssignments('numeric').map(item => item.value)).toEqual([
      [{ value: 42 }],
      [{ value: 42 }],
      [{ value: 42 }],
    ]);

    expect(entity.getPropertyAssignments('date').map(item => item.value)).toEqual([
      [{ value: 1609459200000 }],
      [{ value: 1609459200000 }],
      [{ value: 1609459200000 }],
    ]);

    expect(
      entity.getPropertyAssignments('geolocation_geolocation').map(item => item.value)
    ).toEqual([
      [{ value: { lat: 48.8566, lon: 2.3522, label: 'Paris' } }],
      [{ value: { lat: 48.8566, lon: 2.3522, label: 'Paris' } }],
      [{ value: { lat: 48.8566, lon: 2.3522, label: 'Paris' } }],
    ]);

    expect(entity.getPropertyAssignments('image').map(item => item.value)).toEqual([
      [{ value: '/api/files/image.jpg' }],
      [{ value: '/api/files/image.jpg' }],
      [{ value: '/api/files/image.jpg' }],
    ]);

    expect(entity.getPropertyAssignments('link').map(item => item.value)).toEqual([
      [{ value: { url: 'https://example.com', label: 'Example' } }],
      [{ value: { url: 'https://example.com', label: 'Example' } }],
      [{ value: { url: 'https://example.com', label: 'Example' } }],
    ]);

    expect(entity.getPropertyAssignments('markdown').map(item => item.value)).toEqual([
      [{ value: '<p>A description in multiple languages</p>' }],
      [{ value: '<p>A description in multiple languages</p>' }],
      [{ value: '<p>A description in multiple languages</p>' }],
    ]);

    expect(entity.getPropertyAssignments('multi_date').map(item => item.value)).toEqual([
      [{ value: 1609459200000 }, { value: 1612137600000 }],
      [{ value: 1609459200000 }, { value: 1612137600000 }],
      [{ value: 1609459200000 }, { value: 1612137600000 }],
    ]);

    expect(entity.getPropertyAssignments('multi_date_range').map(item => item.value)).toEqual([
      [
        { value: { from: 1609459200000, to: 1612137600000 } },
        { value: { from: 1609459200000, to: 1612137600000 } },
      ],
      [
        { value: { from: 1609459200000, to: 1612137600000 } },
        { value: { from: 1609459200000, to: 1612137600000 } },
      ],
      [
        { value: { from: 1609459200000, to: 1612137600000 } },
        { value: { from: 1609459200000, to: 1612137600000 } },
      ],
    ]);

    expect(entity.getPropertyAssignments('select').map(item => item.value)).toEqual([
      [{ value: 'us', label: 'United States' }],
      [{ value: 'us', label: 'États-Unis' }],
      [{ value: 'us', label: 'Estados Unidos' }],
    ]);

    expect(entity.getPropertyAssignments('multi_select').map(item => item.value)).toEqual([
      [
        { value: 'tag1', label: 'Tag One' },
        { value: 'tag2', label: 'Tag Two' },
      ],
      [
        { value: 'tag1', label: 'Tag Un' },
        { value: 'tag2', label: 'Tag Deux' },
      ],
      [
        { value: 'tag1', label: 'Tag Uno' },
        { value: 'tag2', label: 'Tag Dos' },
      ],
    ]);
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

    entity.setPropertyAssignments([
      entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
    ]);

    entity.setPropertyAssignments([
      entity.template.createPropertyAssignment('text', {
        value: [{ value: 'A description in multiple languages' }],
      }),
    ]);

    const entityLanguage = new EntityTranslation({
      id: 'id-789',
      language: 'en',
      metadata: {
        ...entity.template.createDefaultPropertyAssignments(),
        text: entity.template.createPropertyAssignment('text', {
          value: [{ value: 'A description in multiple languages' }],
        }),
        numeric: entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
        editDate: entity.template.createPropertyAssignment('editDate', {
          value: [{ value: expect.any(Number) }],
        }),
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

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('title', {
          value: [{ value: 'A title in English' }],
        }),
        entity.template.createPropertyAssignment('text', {
          value: [{ value: 'A description in English' }],
        }),
        entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
      ],
      'en'
    );

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('title', {
          value: [{ value: 'A title in Spanish' }],
        }),
        entity.template.createPropertyAssignment('text', {
          value: [{ value: 'A description in Spanish' }],
        }),
      ],
      'es'
    );

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('title', {
          value: [{ value: 'A title in French' }],
        }),
        entity.template.createPropertyAssignment('text', {
          value: [{ value: 'A description in French' }],
        }),
      ],
      'fr'
    );

    expect(entity.getTranslation('en')).toEqual(
      expect.objectContaining({
        id: 'id-789',
        language: 'en',
        metadata: expect.objectContaining({
          title: { name: 'title', value: [{ value: 'A title in English' }], type: 'text' },
          text: {
            name: 'text',
            value: [{ value: 'A description in English' }],
            type: 'text',
          },
          numeric: { name: 'numeric', value: [{ value: 42 }], type: 'numeric' },

          creationDate: {
            name: 'creationDate',
            value: [{ value: expect.any(Number) }],
            type: 'date',
          },
          editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
        }),
      })
    );

    expect(entity.getTranslation('fr')).toEqual(
      expect.objectContaining({
        id: 'id-789',
        language: 'fr',
        metadata: expect.objectContaining({
          title: { name: 'title', value: [{ value: 'A title in French' }], type: 'text' },
          text: {
            name: 'text',
            value: [{ value: 'A description in French' }],
            type: 'text',
          },
          numeric: { name: 'numeric', value: [{ value: 42 }], type: 'numeric' },

          creationDate: {
            name: 'creationDate',
            value: [{ value: expect.any(Number) }],
            type: 'date',
          },
          editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
        }),
      })
    );

    expect(entity.getTranslation('es')).toEqual(
      expect.objectContaining({
        id: 'id-789',
        language: 'es',
        metadata: expect.objectContaining({
          title: { name: 'title', value: [{ value: 'A title in Spanish' }], type: 'text' },
          text: {
            name: 'text',
            value: [{ value: 'A description in Spanish' }],
            type: 'text',
          },
          numeric: { name: 'numeric', value: [{ value: 42 }], type: 'numeric' },

          creationDate: {
            name: 'creationDate',
            value: [{ value: expect.any(Number) }],
            type: 'date',
          },
          editDate: { name: 'editDate', value: [{ value: expect.any(Number) }], type: 'date' },
        }),
      })
    );
  });

  it('should update the editDate when setting values', async () => {
    const entity = Entity.create(
      {
        languages: ['en', 'pt'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('title', {
          value: [{ value: 'A title in English' }],
        }),
      ],
      'en'
    );

    const firstEditDateEn = entity.getTranslation('en').editDate.value[0].value;
    const firstEditDatePt = entity.getTranslation('pt').editDate.value;

    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, 500));

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('title', {
          value: [{ value: 'A new title in English 2' }],
        }),
      ],
      'en'
    );

    expect(entity.getTranslation('en').editDate.value[0].value).toBeGreaterThan(firstEditDateEn);
    expect(entity.getTranslation('pt').editDate.value).toEqual(firstEditDatePt);
  });

  it('should only sync non-language specific properties when setting values for Select/Multiselect Properties', () => {
    const template = TemplateBuilder.aTemplate({ id: 'template-123' })
      .withProperties([
        new SelectProperty({
          id: 'fruits',
          template: 'template-123',
          label: 'select',
          content: 'thes-123',
        }),
        new MultiSelectProperty({
          id: 'fruits',
          template: 'template-123',
          label: 'multiselect',
          content: 'thes-123',
        }),
      ])
      .build();

    const entity = Entity.create(
      {
        languages: ['en', 'fr'],
        template,
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    const selectAssignments = [
      template.createPropertyAssignment('select', {
        value: [{ value: 'apple', label: 'Apple in English' }],
        language: 'en',
      }),

      template.createPropertyAssignment('select', {
        value: [{ value: 'apple', label: 'Apple in French' }],
        language: 'fr',
      }),
    ];

    const multiSelectAssignments = [
      template.createPropertyAssignment('multiselect', {
        value: [
          { value: 'banana', label: 'Banana in English' },
          { value: 'orange', label: 'Orange in English' },
        ],
        language: 'en',
      }),
      template.createPropertyAssignment('multiselect', {
        value: [
          { value: 'banana', label: 'Banana in French' },
          { value: 'orange', label: 'Orange in French' },
        ],
        language: 'fr',
      }),
    ];

    entity.setPropertyAssignments(selectAssignments, 'en');
    expect(entity.getTranslation('en').metadata.select).toEqual(selectAssignments[0]);
    expect(entity.getTranslation('fr').metadata.select).toEqual(selectAssignments[1]);

    entity.setPropertyAssignments(multiSelectAssignments);
    expect(entity.getTranslation('en').metadata.multiselect).toEqual(multiSelectAssignments[0]);
    expect(entity.getTranslation('fr').metadata.multiselect).toEqual(multiSelectAssignments[1]);
  });

  it('should only sync non-language specific properties when setting values for Relationship Property', async () => {
    const template = TemplateBuilder.aTemplate({ id: 'template-123' })
      .withProperties([
        V1RelationshipProperty.create({
          id: 'text_rel',
          template: 'template-123',
          label: 'text_rel',
          required: true,
          relationType: 'relationType',
          inherit: {
            type: 'text',
            property: 'text',
          },
        }),
      ])
      .build();

    const entity = Entity.create(
      { languages: ['en', 'fr'], template, userId: 'user-456' },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments([
      template.createPropertyAssignment('text_rel', {
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Text EN' }],
            icon: { id: 'any_id', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
        language: 'en',
      }),

      template.createPropertyAssignment('text_rel', {
        value: [
          {
            value: 'B1',
            label: 'B1 FR',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Text FR' }],
            icon: { id: 'any_id', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
        language: 'fr',
      }),
    ]);

    expect(entity.getPropertyAssignments('text_rel')).toEqual([
      {
        name: 'text_rel',
        type: 'relationship',
        language: 'en',
        value: [
          {
            value: 'B1',
            label: 'B1 EN',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Text EN' }],
            icon: { id: 'any_id', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
      {
        name: 'text_rel',
        type: 'relationship',
        language: 'fr',
        value: [
          {
            value: 'B1',
            label: 'B1 FR',
            inheritedType: 'text',
            inheritedValue: [{ value: 'Text FR' }],
            icon: { id: 'any_id', label: 'iconB1', type: 'img' },
            type: 'entity',
          },
        ],
      },
    ]);
  });

  it('should sync numeric properties to all languages even when target language is specified', () => {
    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments(
      [entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] })],
      'en'
    );

    expect(entity.getTranslation('en').metadata.numeric.value).toEqual([{ value: 42 }]);
    expect(entity.getTranslation('fr').metadata.numeric.value).toEqual([{ value: 42 }]);
    expect(entity.getTranslation('es').metadata.numeric.value).toEqual([{ value: 42 }]);
  });

  it('should sync date properties to all languages even when target language is specified', () => {
    const template = TemplateBuilder.aTemplate({ id: 'template-123' })
      .withProperties([
        new DateProperty({
          id: 'eventDate',
          name: 'eventDate',
          template: 'template-123',
          label: 'Event Date',
        }),
      ])
      .build();

    const entity = Entity.create(
      {
        languages: ['en', 'fr'],
        template,
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments(
      [template.createPropertyAssignment('eventDate', { value: [{ value: 1609459200000 }] })],
      'en'
    );

    expect(entity.getTranslation('en').metadata.eventDate.value).toEqual([
      { value: 1609459200000 },
    ]);
    expect(entity.getTranslation('fr').metadata.eventDate.value).toEqual([
      { value: 1609459200000 },
    ]);
  });

  it('should sync geolocation properties to all languages even when target language is specified', () => {
    const template = TemplateBuilder.aTemplate({ id: 'template-123' })
      .withProperties([
        new GeolocationProperty({
          id: 'place',
          name: 'place',
          template: 'template-123',
          label: 'Place',
        }),
      ])
      .build();

    const entity = Entity.create(
      {
        languages: ['en', 'fr'],
        template,
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments(
      [
        template.createPropertyAssignment('place', {
          value: [{ value: { lat: 40.7128, lon: -74.006, label: 'New York' } }],
        }),
      ],
      'en'
    );

    expect(entity.getTranslation('en').metadata.place.value).toEqual([
      { value: { lat: 40.7128, lon: -74.006, label: 'New York' } },
    ]);
    expect(entity.getTranslation('fr').metadata.place.value).toEqual([
      { value: { lat: 40.7128, lon: -74.006, label: 'New York' } },
    ]);
  });

  it('should NOT sync text properties to other languages when target language is specified', () => {
    const entity = Entity.create(
      {
        languages: ['en', 'fr', 'es'],
        template: createSampleTemplate(),
        userId: 'user-456',
      },
      { generate: () => 'id-789' }
    );

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('text', {
          value: [{ value: 'Description in English' }],
        }),
      ],
      'en'
    );

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('text', {
          value: [{ value: 'Description en français' }],
        }),
      ],
      'fr'
    );

    expect(entity.getTranslation('en').metadata.text.value).toEqual([
      { value: 'Description in English' },
    ]);
    expect(entity.getTranslation('fr').metadata.text.value).toEqual([
      { value: 'Description en français' },
    ]);
    expect(entity.getTranslation('es').metadata.text.value).toEqual([]);
  });

  describe('validate for required Properties when settings values', () => {
    it('should require Text', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-text' })
        .withProperties([
          new TextProperty({
            id: 'text',
            template: 'template-req-text',
            label: 'Text',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-1' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Text Property is required'
      );
    });

    it('should require Numeric', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-numeric' })
        .withProperties([
          new NumericProperty({
            id: 'numeric',
            template: 'template-req-numeric',
            label: 'Numeric',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-1' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Numeric Property is required'
      );
    });

    it('should require Date', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-date' })
        .withProperties([
          new DateProperty({
            id: 'date',
            template: 'template-req-date',
            label: 'Date',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-1' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Date Property is required'
      );
    });

    it('should require Date Range', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-daterange' })
        .withProperties([
          new DateRangeProperty({
            id: 'dr',
            template: 'template-req-daterange',
            label: 'DR',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-2' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Date Range Property is required'
      );
    });

    it('should require Multi Date', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-multidate' })
        .withProperties([
          new MultiDateProperty({
            id: 'md',
            template: 'template-req-multidate',
            label: 'MD',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-3' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Multi Date Property is required'
      );
    });

    it('should require Multi Date Range', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-mdr' })
        .withProperties([
          new MultiDateRangeProperty({
            id: 'mdr',
            template: 'template-req-mdr',
            label: 'MDR',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-4' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Multi Date Range Property is required'
      );
    });

    it('should require Select', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-select' })
        .withProperties([
          new SelectProperty({
            id: 'sel',
            template: 'template-req-select',
            label: 'SEL',
            required: true,
            content: 'thes-1',
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-5' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Select Property is required'
      );
    });

    it('should require MultiSelect', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-ms' })
        .withProperties([
          new MultiSelectProperty({
            id: 'ms',
            template: 'template-req-ms',
            label: 'MS',
            required: true,
            content: 'thes-1',
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-6' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Select/MultiSelect Property is required'
      );
    });

    it('should require Geolocation', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-geo' })
        .withProperties([
          new GeolocationProperty({
            id: 'geo',
            template: 'template-req-geo',
            label: 'GEO',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-7' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Geolocation Property is required'
      );
    });

    it('should require Link', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-link' })
        .withProperties([
          new LinkProperty({
            id: 'link',
            template: 'template-req-link',
            label: 'LINK',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-8' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Link Property is required'
      );
    });

    it('should require Markdown', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-md' })
        .withProperties([
          new MarkdownProperty({
            id: 'md',
            template: 'template-req-md',
            label: 'MD',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-9' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Markdown Property is required'
      );
    });

    it('should require Image', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-img' })
        .withProperties([
          new ImageProperty({
            id: 'img',
            template: 'template-req-img',
            label: 'IMG',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-10' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Image Property is required'
      );
    });

    it('should require Media', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-media' })
        .withProperties([
          new MediaProperty({
            id: 'media',
            template: 'template-req-media',
            label: 'MEDIA',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-11' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Media Property is required'
      );
    });

    it('should require Preview', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-prev' })
        .withProperties([
          new PreviewProperty({
            id: 'prev',
            template: 'template-req-prev',
            label: 'PREV',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-12' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Preview Property is required'
      );
    });

    it('should require Nested', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-nested' })
        .withProperties([
          new NestedProperty({
            id: 'nest',
            template: 'template-req-nested',
            label: 'NEST',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-13' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Nested Property is required'
      );
    });

    it('should require Relationship', () => {
      const template = TemplateBuilder.aTemplate({ id: 'template-req-rel' })
        .withProperties([
          V1RelationshipProperty.create({
            id: 'rel',
            name: 'rel',
            label: 'REL',
            template: 'template-req-rel',
            relationType: 'rt1',
            content: 'template-req-rel',
            required: true,
          }),
        ])
        .build();

      const entity = Entity.create(
        { languages: ['en'], template, userId: 'user-req' },
        { generate: () => 'id-req-14' }
      );

      expect(() => entity.setPropertyAssignments([], undefined, true)).toThrow(
        'Relationship Property is required'
      );
    });
  });
});
