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
import { PermissionType } from '../PermissionType';
import { AccessLevel } from '../AccessLevel';

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

    const entity = Entity.create({
      languages: ['en', 'fr', 'es'],
      template,
    });

    const entityLanguage = new EntityTranslation({
      id: undefined,
      metadata: template.createDefaultPropertyAssignments(),
      language: 'en',
    });

    expect(entity.sharedId).toEqual(expect.any(String));
    expect(entity.published).toBe(false);
    expect(entity.getTranslation('en').creationDate.value[0].value).toEqual(expect.any(Number));

    expect(entity.translations).toEqual({
      en: entityLanguage,
      es: { ...entityLanguage, language: 'es' },
      fr: { ...entityLanguage, language: 'fr' },
    });
  });

  it('should grant access for Entity creator when present', () => {
    const template = createSampleTemplate();

    const entity = Entity.create({
      languages: ['en', 'fr', 'es'],
      template,
      userId: 'user-456',
    });

    expect(entity.permissions.accessGrants).toEqual([
      { refId: 'user-456', type: PermissionType.User, level: AccessLevel.Write },
    ]);
  });

  it('should sync values in all languages when no language is specified', () => {
    const entity = Entity.create({
      languages: ['en', 'fr', 'es'],
      template: createSampleTemplate(),
      userId: 'user-456',
    });

    entity.setPropertyAssignmentsInAllLanguages([
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

      entity.template.createPropertyAssignment('media', {
        value: [{ value: '/api/files/media.jpg' }],
      }),

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

    expect(entity.getPropertyAssignments('media').map(item => item.value)).toEqual([
      [{ value: '/api/files/media.jpg' }],
      [{ value: '/api/files/media.jpg' }],
      [{ value: '/api/files/media.jpg' }],
    ]);
  });

  it('should allow partial updates when setting values', () => {
    const entity = Entity.create({
      languages: ['en', 'fr', 'es'],
      template: createSampleTemplate(),
      userId: 'user-456',
    });

    entity.setPropertyAssignmentsInAllLanguages([
      entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] }),
    ]);

    entity.setPropertyAssignmentsInAllLanguages([
      entity.template.createPropertyAssignment('text', {
        value: [{ value: 'A description in multiple languages' }],
      }),
    ]);

    const entityLanguage = new EntityTranslation({
      id: undefined,
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

  it('should update the editDate when setting values', async () => {
    const entity = Entity.create({
      languages: ['en', 'pt'],
      template: createSampleTemplate(),
      userId: 'user-456',
    });

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

  describe('Property synchronization across languages', () => {
    describe('Properties that SHOULD sync across all languages', () => {
      it('should sync numeric properties even when target language is specified', () => {
        const entity = Entity.create({
          languages: ['en', 'fr', 'es'],
          template: createSampleTemplate(),
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [entity.template.createPropertyAssignment('numeric', { value: [{ value: 42 }] })],
          'en'
        );

        expect(entity.getTranslation('en').metadata.numeric.value).toEqual([{ value: 42 }]);
        expect(entity.getTranslation('fr').metadata.numeric.value).toEqual([{ value: 42 }]);
        expect(entity.getTranslation('es').metadata.numeric.value).toEqual([{ value: 42 }]);
      });

      it('should sync date properties even when target language is specified', () => {
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

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

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

      it('should sync date range properties even when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new DateRangeProperty({
              id: 'period',
              name: 'period',
              template: 'template-123',
              label: 'Period',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('period', {
              value: [{ value: { from: 1609459200000, to: 1612137600000 } }],
            }),
          ],
          'en'
        );

        expect(entity.getTranslation('en').metadata.period.value).toEqual([
          { value: { from: 1609459200000, to: 1612137600000 } },
        ]);
        expect(entity.getTranslation('fr').metadata.period.value).toEqual([
          { value: { from: 1609459200000, to: 1612137600000 } },
        ]);
      });

      it('should sync multi date properties even when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new MultiDateProperty({
              id: 'events',
              name: 'events',
              template: 'template-123',
              label: 'Events',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('events', {
              value: [{ value: 1609459200000 }, { value: 1612137600000 }],
            }),
          ],
          'en'
        );

        expect(entity.getTranslation('en').metadata.events.value).toEqual([
          { value: 1609459200000 },
          { value: 1612137600000 },
        ]);
        expect(entity.getTranslation('fr').metadata.events.value).toEqual([
          { value: 1609459200000 },
          { value: 1612137600000 },
        ]);
      });

      it('should sync multi date range properties even when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new MultiDateRangeProperty({
              id: 'periods',
              name: 'periods',
              template: 'template-123',
              label: 'Periods',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('periods', {
              value: [
                { value: { from: 1609459200000, to: 1612137600000 } },
                { value: { from: 1614556800000, to: 1617235200000 } },
              ],
            }),
          ],
          'en'
        );

        expect(entity.getTranslation('en').metadata.periods.value).toEqual([
          { value: { from: 1609459200000, to: 1612137600000 } },
          { value: { from: 1614556800000, to: 1617235200000 } },
        ]);
        expect(entity.getTranslation('fr').metadata.periods.value).toEqual([
          { value: { from: 1609459200000, to: 1612137600000 } },
          { value: { from: 1614556800000, to: 1617235200000 } },
        ]);
      });

      it('should sync geolocation properties even when target language is specified', () => {
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

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

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

      it('should sync nested properties even when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new NestedProperty({
              id: 'nested',
              name: 'nested',
              template: 'template-123',
              label: 'Nested',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('nested', {
              value: [
                {
                  value: {
                    key1: [{ value: 'value1' }],
                    key2: [{ value: 'value2' }],
                  },
                },
              ],
            }),
          ],
          'en'
        );

        expect(entity.getTranslation('en').metadata.nested.value).toEqual([
          {
            value: {
              key1: [{ value: 'value1' }],
              key2: [{ value: 'value2' }],
            },
          },
        ]);
        expect(entity.getTranslation('fr').metadata.nested.value).toEqual([
          {
            value: {
              key1: [{ value: 'value1' }],
              key2: [{ value: 'value2' }],
            },
          },
        ]);
      });

      it('should sync generated ID properties even when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new GenerateIdProperty({
              id: 'genId',
              name: 'genId',
              template: 'template-123',
              label: 'Generated ID',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('genId', {
              value: [{ value: 'AUTO-123' }],
            }),
          ],
          'en'
        );

        expect(entity.getTranslation('en').metadata.genId.value).toEqual([{ value: 'AUTO-123' }]);
        expect(entity.getTranslation('fr').metadata.genId.value).toEqual([{ value: 'AUTO-123' }]);
      });
    });

    describe('Properties that should NOT sync across languages', () => {
      it('should NOT sync text properties when target language is specified', () => {
        const entity = Entity.create({
          languages: ['en', 'fr', 'es'],
          template: createSampleTemplate(),
          userId: 'user-456',
        });

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

      it('should NOT sync markdown properties when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new MarkdownProperty({
              id: 'content',
              name: 'content',
              template: 'template-123',
              label: 'Content',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('content', {
              value: [{ value: '<p>English content</p>' }],
            }),
          ],
          'en'
        );

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('content', {
              value: [{ value: '<p>Contenu en français</p>' }],
            }),
          ],
          'fr'
        );

        expect(entity.getTranslation('en').metadata.content.value).toEqual([
          { value: '<p>English content</p>' },
        ]);
        expect(entity.getTranslation('fr').metadata.content.value).toEqual([
          { value: '<p>Contenu en français</p>' },
        ]);
      });

      it('should NOT sync link properties when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new LinkProperty({
              id: 'website',
              name: 'website',
              template: 'template-123',
              label: 'Website',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('website', {
              value: [{ value: { url: 'https://example.com/en', label: 'English Site' } }],
            }),
          ],
          'en'
        );

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('website', {
              value: [{ value: { url: 'https://example.com/fr', label: 'Site en Français' } }],
            }),
          ],
          'fr'
        );

        expect(entity.getTranslation('en').metadata.website.value).toEqual([
          { value: { url: 'https://example.com/en', label: 'English Site' } },
        ]);
        expect(entity.getTranslation('fr').metadata.website.value).toEqual([
          { value: { url: 'https://example.com/fr', label: 'Site en Français' } },
        ]);
      });

      it('should NOT sync image properties when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new ImageProperty({
              id: 'photo',
              name: 'photo',
              template: 'template-123',
              label: 'Photo',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('photo', {
              value: [{ value: '/api/files/image-en.jpg' }],
            }),
          ],
          'en'
        );

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('photo', {
              value: [{ value: '/api/files/image-fr.jpg' }],
            }),
          ],
          'fr'
        );

        expect(entity.getTranslation('en').metadata.photo.value).toEqual([
          { value: '/api/files/image-en.jpg' },
        ]);
        expect(entity.getTranslation('fr').metadata.photo.value).toEqual([
          { value: '/api/files/image-fr.jpg' },
        ]);
      });

      it('should NOT sync media properties when target language is specified', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new MediaProperty({
              id: 'video',
              name: 'video',
              template: 'template-123',
              label: 'Video',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('video', {
              value: [{ value: '/api/files/video-en.mp4' }],
            }),
          ],
          'en'
        );

        entity.setPropertyAssignments(
          [
            template.createPropertyAssignment('video', {
              value: [{ value: '/api/files/video-fr.mp4' }],
            }),
          ],
          'fr'
        );

        expect(entity.getTranslation('en').metadata.video.value).toEqual([
          { value: '/api/files/video-en.mp4' },
        ]);
        expect(entity.getTranslation('fr').metadata.video.value).toEqual([
          { value: '/api/files/video-fr.mp4' },
        ]);
      });

      it('should maintain language-specific labels for Select properties', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new SelectProperty({
              id: 'fruits',
              template: 'template-123',
              label: 'select',
              content: 'thes-123',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

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

        entity.setPropertyAssignments(selectAssignments, 'en');

        expect(entity.getTranslation('en').metadata.select).toEqual(selectAssignments[0]);
        expect(entity.getTranslation('fr').metadata.select).toEqual(selectAssignments[1]);
      });

      it('should maintain language-specific labels for MultiSelect properties', () => {
        const template = TemplateBuilder.aTemplate({ id: 'template-123' })
          .withProperties([
            new MultiSelectProperty({
              id: 'fruits',
              template: 'template-123',
              label: 'multiselect',
              content: 'thes-123',
            }),
          ])
          .build();

        const entity = Entity.create({
          languages: ['en', 'fr'],
          template,
          userId: 'user-456',
        });

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

        entity.setPropertyAssignmentsInAllLanguages(multiSelectAssignments);

        expect(entity.getTranslation('en').metadata.multiselect).toEqual(multiSelectAssignments[0]);
        expect(entity.getTranslation('fr').metadata.multiselect).toEqual(multiSelectAssignments[1]);
      });

      it('should maintain language-specific labels for Relationship properties', async () => {
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

        const entity = Entity.create({ languages: ['en', 'fr'], template, userId: 'user-456' });

        entity.setPropertyAssignmentsInAllLanguages([
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
    });
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
        'Media Property is required'
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
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

      const entity = Entity.create({ languages: ['en'], template, userId: 'user-req' });

      expect(() => entity.setPropertyAssignmentsInAllLanguages([], true)).toThrow(
        'Relationship Property is required'
      );
    });
  });
});
