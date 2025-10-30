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
      entity.template.createPropertyAssignment('description', {
        value: [{ value: 'A description in multiple languages' }],
      }),
      entity.template.createPropertyAssignment('age', { value: [{ value: 42 }] }),
    ]);

    const entityLanguage = new EntityTranslation({
      id: 'id-789',
      language: 'en',
      metadata: {
        ...entity.template.createDefaultPropertyAssignments(),
        description: entity.template.createPropertyAssignment('description', {
          value: [{ value: 'A description in multiple languages' }],
        }),
        age: entity.template.createPropertyAssignment('age', { value: [{ value: 42 }] }),
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
      entity.template.createPropertyAssignment('age', { value: [{ value: 42 }] }),
    ]);

    entity.setPropertyAssignments([
      entity.template.createPropertyAssignment('description', {
        value: [{ value: 'A description in multiple languages' }],
      }),
    ]);

    const entityLanguage = new EntityTranslation({
      id: 'id-789',
      language: 'en',
      metadata: {
        creationDate: entity.template.createPropertyAssignment('creationDate', {
          value: [{ value: expect.any(Number) }],
        }),
        description: entity.template.createPropertyAssignment('description', {
          value: [{ value: 'A description in multiple languages' }],
        }),
        age: entity.template.createPropertyAssignment('age', { value: [{ value: 42 }] }),
        title: entity.template.createPropertyAssignment('title', { value: [] }),
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
        entity.template.createPropertyAssignment('description', {
          value: [{ value: 'A description in English' }],
        }),
        entity.template.createPropertyAssignment('age', { value: [{ value: 42 }] }),
      ],
      'en'
    );

    entity.setPropertyAssignments(
      [
        entity.template.createPropertyAssignment('title', {
          value: [{ value: 'A title in Spanish' }],
        }),
        entity.template.createPropertyAssignment('description', {
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
        entity.template.createPropertyAssignment('description', {
          value: [{ value: 'A description in French' }],
        }),
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Text Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Numeric Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Date Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Date Range Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Multi Date Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow(
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Select Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow(
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Geolocation Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Link Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Markdown Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Image Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Media Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Preview Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Nested Property is required');
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

      expect(() => entity.setPropertyAssignments([])).toThrow('Relationship Property is required');
    });
  });
});
