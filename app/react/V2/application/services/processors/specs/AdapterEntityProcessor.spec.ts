import { Entity, MetadataProperty } from 'app/V2/domain';
import {
  DateMetadataProperty,
  MultiDateMetadataProperty,
  SelectMetadataProperty,
  MultiSelectMetadataProperty,
  LinkMetadataProperty,
} from 'app/V2/domain/entities/types';
import { DEFAULT_ENTITY_BASE_PATH } from 'V2/application/optionsPresets';
import { processingContext, rawEntity } from './PropertyProcessorsFixtures';
import { AdapterEntityProcessor } from '../AdapterEntityProcessor';

describe('Adapter Entity Processor Tests', () => {
  const adapterEntityProcessor = new AdapterEntityProcessor(processingContext);
  let entity: Entity;
  let restEntity: Omit<Entity, 'metadata'>;
  let metadata: MetadataProperty[];

  beforeAll(() => {
    const result = adapterEntityProcessor.processEntity(rawEntity);
    entity = result.entity;
    ({ metadata, ...restEntity } = entity);
  });

  it('should process entity data', async () => {
    const creationDate: DateMetadataProperty = {
      name: 'creationDate',
      type: 'date',
      label: 'Creation Date',
      translatedLabel: 'Creation Date',
      values: [
        {
          value: 1759374706,
          label: 'Oct 2, 2025',
        },
      ],
      _id: 'creationDate',
    };

    const editDate: DateMetadataProperty = {
      name: 'editDate',
      type: 'date',
      label: 'Edit Date',
      translatedLabel: 'Edit Date',
      values: [
        {
          value: 1760366924,
          label: 'Oct 13, 2025',
        },
      ],
      _id: 'editDate',
    };

    const formattedTemplate = {
      _id: 'template.incident-report',
      name: 'Incident Report Template',
      label: 'Incident Report Template EN',
      color: '#C03B22',
      entityViewPage: '',
    };

    const expectedEntity: Omit<Entity, 'metadata'> = {
      _id: 'entity.test-incident',
      title: 'Test Incident Report',
      template: formattedTemplate,
      sharedId: 'test-incident-001',
      language: 'en',
      icon: undefined,
      creationDate,
      editDate,
    };

    expect(restEntity).toMatchObject(expectedEntity);
  });

  it('should process text property', async () => {
    const textProperty = {
      name: 'simple_text',
      type: 'text',
      label: 'Simple Text',
      translatedLabel: 'Simple Text EN',
      values: [
        {
          value: 'Test incident report',
        },
      ],
    };

    expect(metadata[0]).toMatchObject(textProperty);
  });

  it('should process markdown property', async () => {
    const markdownProperty = {
      name: 'markdown_syntax',
      type: 'markdown',
      label: 'Markdown Syntax',
      translatedLabel: 'Markdown Syntax EN',
      values: [
        {
          value: '# Test Report\n**Status:** Under Investigation',
        },
      ],
    };

    expect(metadata[1]).toMatchObject(markdownProperty);
  });

  it('should process date property', async () => {
    const dateProperty: DateMetadataProperty = {
      name: 'single_date',
      type: 'date',
      label: 'Single Date',
      translatedLabel: 'Single Date EN',
      values: [{ value: 1759363200, label: 'Oct 2, 2025' }],
      _id: 'prop.single-date',
    };

    expect(metadata[2]).toMatchObject(dateProperty);
  });

  it('should process geolocation property', async () => {
    const geolocationProperty = {
      name: 'location_of_interest',
      type: 'geolocation',
      label: 'Location of Interest',
      translatedLabel: 'Location of Interest EN',
      values: [
        {
          value: {
            latitude: 46.3964365565104,
            longitude: 3.6694335937500004,
          },
          label: 'Location of Interest',
        },
      ],
    };

    expect(metadata[3]).toMatchObject(geolocationProperty);
  });

  it('should process multiple date property', async () => {
    const multipleDateProperty: MultiDateMetadataProperty = {
      name: 'multiple_dates',
      type: 'multidate',
      label: 'Multiple Dates',
      translatedLabel: 'Multiple Dates EN',
      values: [
        { value: 1759276800, label: 'Oct 1, 2025' },
        { value: 1759363200, label: 'Oct 2, 2025' },
        { value: 1759449600, label: 'Oct 3, 2025' },
      ],
      _id: 'prop.multiple-dates',
    };

    expect(metadata[4]).toMatchObject(multipleDateProperty);
  });

  it('should process date range property', async () => {
    const dateRangeProperty = {
      name: 'date_range',
      type: 'daterange',
      label: 'Date Range',
      translatedLabel: 'Date Range EN',
      values: [{ value: { from: 1759276800, to: 1761955199 } }],
    };

    expect(metadata[5]).toMatchObject(dateRangeProperty);
  });

  it('should process multiple date range property', async () => {
    const multipleDateRangeProperty = {
      name: 'multiple_date_ranges',
      type: 'multidaterange',
      label: 'Multiple Date Ranges',
      translatedLabel: 'Multiple Date Ranges EN',
      values: [
        { value: { from: 1759276800, to: 1759449599 } },
        { value: { from: 1759363200, to: 1759535999 } },
      ],
    };

    expect(metadata[6]).toMatchObject(multipleDateRangeProperty);
  });

  it('should process select property', async () => {
    const selectProperty: SelectMetadataProperty = {
      name: 'status_selection',
      type: 'select',
      label: 'Status Selection',
      translatedLabel: 'Status Selection EN',
      values: [
        {
          value: 'thesaurus.again',
          label: 'Again',
        },
      ],
      _id: 'prop.status-selection',
    };

    expect(metadata[7]).toMatchObject(selectProperty);
  });

  it('should process multiselect property', async () => {
    const multiselectProperty: MultiSelectMetadataProperty = {
      name: 'category_tags',
      type: 'multiselect',
      label: 'Category Tags',
      translatedLabel: 'Category Tags EN',
      values: [
        {
          value: 'thesaurus.acknowledging',
          label: 'Acknowledging',
        },
        {
          value: 'thesaurus.again',
          label: 'Again',
        },
        {
          value: 'thesaurus.verb2',
          label: 'verb2',
          parent: {
            label: 'grouped',
            value: 'thesaurus.grouped',
          },
        },
        {
          value: 'thesaurus.verb1',
          label: 'verb1',
          parent: {
            label: 'grouped',
            value: 'thesaurus.grouped',
          },
        },
      ],
      _id: 'prop.category-tags',
    };

    expect(metadata[8]).toMatchObject(multiselectProperty);
  });

  it('should process relationship property', async () => {
    const relationshipProperty = {
      name: 'related_people',
      type: 'relationship',
      label: 'Related People',
      translatedLabel: 'Related People EN',
      values: [
        {
          value: 'thesaurus.again',
          label: 'Again',
          source: {
            icon: 'ECU',
            label: 'Maria Rodriguez - Witness',
            url: `${DEFAULT_ENTITY_BASE_PATH}entity.witness-maria`,
            value: 'entity.witness-maria',
          },
        },
        {
          value: 'thesaurus.acknowledging',
          label: 'Acknowledging',
          source: {
            icon: 'ECU',
            label: 'Maria Rodriguez - Witness',
            url: `${DEFAULT_ENTITY_BASE_PATH}entity.witness-maria`,
            value: 'entity.witness-maria',
          },
        },
        {
          value: 'thesaurus.expressing',
          label: 'Expressing',
          source: {
            value: 'entity.reporter-john',
            label: 'John Smith - Reporter',
            url: `${DEFAULT_ENTITY_BASE_PATH}entity.reporter-john`,
          },
        },
        {
          value: 'thesaurus.verb2',
          label: 'verb2',
          parent: {
            value: 'thesaurus.grouped',
            label: 'grouped',
          },
          source: {
            value: 'entity.reporter-john',
            label: 'John Smith - Reporter',
            url: `${DEFAULT_ENTITY_BASE_PATH}entity.reporter-john`,
          },
        },
      ],
      properties: {
        inherited: true,
        inheritedProperty: {
          type: 'multiselect',
          label: 'Category Tags',
          name: 'category_tags',
          translatedLabel: 'Category Tags',
        },
      },
    };

    expect(metadata[9]).toMatchObject(relationshipProperty);
  });

  it('should process link property', async () => {
    const linkProperty: LinkMetadataProperty = {
      name: 'external_link',
      type: 'link',
      label: 'External Link',
      translatedLabel: 'External Link EN',
      values: [
        {
          value: 'https://police.gov/reports/incident-2024-001',
          label: 'Police Report',
        },
      ],
      _id: 'prop.external-link',
    };

    expect(metadata[11]).toMatchObject(linkProperty);
  });

  it('should process image property', async () => {
    const imageProperty = {
      name: 'selected_image',
      type: 'image',
      label: 'Selected Image',
      translatedLabel: 'Selected Image EN',
      values: [
        {
          value: '/api/files/test-image.png',
          alt: 'Image not described',
        },
      ],
    };

    expect(metadata[12]).toMatchObject(imageProperty);
  });

  it('should process preview property', async () => {
    const previewProperty = {
      name: 'preview_document',
      type: 'preview',
      label: 'Preview Document',
      translatedLabel: 'Preview Document EN',
      values: [
        {
          alt: 'MockPDF.pdf',
          value: '/api/files/d1.jpg',
        },
      ],
    };

    expect(metadata[13]).toMatchObject(previewProperty);
  });

  it('should process media property', async () => {
    const mediaProperty = {
      name: 'video_of_event',
      type: 'media',
      label: 'Video of Event',
      translatedLabel: 'Video of Event EN',
      values: [
        {
          value: '/api/files/test-video.mp4',
        },
      ],
    };

    expect(metadata[14]).toMatchObject(mediaProperty);
  });

  it('should process combined geolocation properties when combineGeolocation is true', async () => {
    const combinedGeolocationProperty = {
      name: '_combined_geolocation',
      type: 'geolocation',
      label: 'Combined Geolocation',
      translatedLabel: 'Combined Geolocation',
      values: [
        {
          value: { latitude: 44.33301685687683, longitude: 5.998535156250001 },
          name: 'incident_location',
          label: 'Incident Location',
        },
        {
          value: { latitude: 62.58069554111894, longitude: 15.468750000000002 },
          name: 'secondary_location',
          label: 'Secondary Location',
        },
        {
          value: { latitude: 43.80157978110818, longitude: 7.492675781250001 },
          name: 'location_relationships',
          label: 'Witness Location - Maria Rodriguez',
          source: {
            value: 'entity.witness-maria',
            label: 'Witness Location - Maria Rodriguez',
            color: '#C03B22',
            icon: 'ECU',
            type: 'entity',
            inheritedType: 'geolocation',
            url: '/entity/entity.witness-maria',
          },
        },
      ],
    };

    expect(metadata[15]).toMatchObject(combinedGeolocationProperty);
  });

  it('should process hierarchical_relationships property', async () => {
    const hierarchicalRelationshipsProperty = {
      name: 'hierarchical_relationships',
      type: 'relationship',
      label: 'Hierarchical Relationships',
      translatedLabel: 'Hierarchical Relationships EN',
      values: [
        {
          value: 'thesaurus.again',
          label: 'Again',
          source: {
            value: 'entity.first-responders',
            label: 'First Responders',
            url: '/entity/entity.first-responders',
          },
        },
        {
          value: 'thesaurus.acknowledging',
          label: 'Acknowledging',
          source: {
            value: 'entity.first-responders',
            label: 'First Responders',
            url: '/entity/entity.first-responders',
          },
        },
      ],
    };

    expect(metadata[16]).toMatchObject(hierarchicalRelationshipsProperty);
  });

  it('should process document_id property', async () => {
    const documentIdProperty = {
      name: 'document_id',
      type: 'generatedid',
      label: 'Document ID',
      translatedLabel: 'Document ID EN',
      values: [
        {
          value: 'EVT-2024-001',
        },
      ],
    };
    expect(metadata[17]).toMatchObject(documentIdProperty);
  });

  it('should not combine geolocation properties when combineGeolocation is false', async () => {
    const nonCombiningContext = {
      ...processingContext,
      combineGeolocation: false,
    };
    const nonCombiningProcessor = new AdapterEntityProcessor(nonCombiningContext);
    const result = nonCombiningProcessor.processEntity(rawEntity);
    const nonCombiningMetadata = result.entity.metadata;

    const incidentLocationProperty = {
      name: 'incident_location',
      type: 'geolocation',
      label: 'Incident Location',
      translatedLabel: 'Incident Location EN',
      values: [
        {
          value: { latitude: 44.33301685687683, longitude: 5.998535156250001 },
          label: '44.33°N, 6.00°E',
        },
      ],
    };

    const secondaryLocationProperty = {
      name: 'secondary_location',
      type: 'geolocation',
      label: 'Secondary Location',
      translatedLabel: 'Secondary Location EN',
      values: [
        {
          value: { latitude: 62.58069554111894, longitude: 15.468750000000002 },
          label: '62.58°N, 15.47°E',
        },
      ],
    };

    expect(nonCombiningMetadata[15]).toMatchObject(incidentLocationProperty);
    expect(nonCombiningMetadata[16]).toMatchObject(secondaryLocationProperty);
  });

  it('should not combine geolocation properties in edition mode', async () => {
    const editionContext = {
      ...processingContext,
      editionMode: true,
    };
    const editionProcessor = new AdapterEntityProcessor(editionContext);
    const result = editionProcessor.processEntity(rawEntity);
    const editionMetadata = result.entity.metadata;

    const incidentLocationProperty = {
      name: 'incident_location',
      type: 'geolocation',
      label: 'Incident Location',
      translatedLabel: 'Incident Location EN',
      values: [
        {
          value: { latitude: 44.33301685687683, longitude: 5.998535156250001 },
          label: '44.33°N, 6.00°E',
        },
      ],
    };

    const secondaryLocationProperty = {
      name: 'secondary_location',
      type: 'geolocation',
      label: 'Secondary Location',
      translatedLabel: 'Secondary Location EN',
      values: [
        {
          value: { latitude: 62.58069554111894, longitude: 15.468750000000002 },
          label: '62.58°N, 15.47°E',
        },
      ],
    };

    expect(editionMetadata[15]).toMatchObject(incidentLocationProperty);
    expect(editionMetadata[16]).toMatchObject(secondaryLocationProperty);
  });

  it('should process numeric property', async () => {
    const numericProperty = {
      name: 'numeric_value',
      type: 'numeric',
      label: 'Numeric Value',
      translatedLabel: 'Numeric Value EN',
      values: [
        {
          value: '42.5',
        },
      ],
    };

    expect(metadata[18]).toMatchObject(numericProperty);
  });

  it('should process negative numeric property', async () => {
    const negativeNumericProperty = {
      name: 'negative_numeric',
      type: 'numeric',
      label: 'Negative Numeric',
      translatedLabel: 'Negative Numeric EN',
      values: [
        {
          value: '-15.75',
        },
      ],
    };

    expect(metadata[19]).toMatchObject(negativeNumericProperty);
  });

  it('should process zero numeric property', async () => {
    const zeroNumericProperty = {
      name: 'zero_numeric',
      type: 'numeric',
      label: 'Zero Numeric',
      translatedLabel: 'Zero Numeric EN',
      values: [
        {
          value: '0',
        },
      ],
    };

    expect(metadata[20]).toMatchObject(zeroNumericProperty);
  });

  it('should include showInCard property in metadata', async () => {
    const textProperty = metadata.find(prop => prop.name === 'simple_text');
    const markdownProperty = metadata.find(prop => prop.name === 'markdown_syntax');
    const dateProperty = metadata.find(prop => prop.name === 'single_date');
    const imageProperty = metadata.find(prop => prop.name === 'selected_image');

    expect(textProperty).toHaveProperty('showInCard', true);
    expect(markdownProperty).toHaveProperty('showInCard', false);
    expect(dateProperty).toHaveProperty('showInCard', true);
    expect(imageProperty).toHaveProperty('showInCard', true);
  });

  it('should include style property in metadata', async () => {
    const imageProperty = metadata.find(prop => prop.name === 'selected_image');
    const previewProperty = metadata.find(prop => prop.name === 'preview_document');
    const textProperty = metadata.find(prop => prop.name === 'simple_text');

    expect(imageProperty).toHaveProperty('style', 'fill');
    expect(previewProperty).toHaveProperty('style', 'fill');
    expect(textProperty).toHaveProperty('style', '');
  });

  it('should include required property in metadata', async () => {
    const dateProperty = metadata.find(prop => prop.name === 'single_date');
    const textProperty = metadata.find(prop => prop.name === 'simple_text');
    const numericProperty = metadata.find(prop => prop.name === 'numeric_value');

    expect(dateProperty).toHaveProperty('required', true);
    expect(textProperty).toHaveProperty('required', false);
    expect(numericProperty).toHaveProperty('required', false);
  });

  it('should include noLabel property in metadata', async () => {
    const textProperty = metadata.find(prop => prop.name === 'simple_text');
    const dateProperty = metadata.find(prop => prop.name === 'single_date');
    const imageProperty = metadata.find(prop => prop.name === 'selected_image');

    expect(textProperty).toHaveProperty('noLabel', false);
    expect(dateProperty).toHaveProperty('noLabel', false);
    expect(imageProperty).toHaveProperty('noLabel', false);
  });

  it('should include generatedId property in metadata', async () => {
    const documentIdProperty = metadata.find(prop => prop.name === 'document_id');
    const textProperty = metadata.find(prop => prop.name === 'simple_text');
    const numericProperty = metadata.find(prop => prop.name === 'numeric_value');

    expect(documentIdProperty).toHaveProperty('generatedId', false);
    expect(textProperty).toHaveProperty('generatedId', false);
    expect(numericProperty).toHaveProperty('generatedId', false);
  });

  it('should include translatedLabel when translateLabels is true', async () => {
    const textProperty = metadata.find(prop => prop.name === 'simple_text');
    const dateProperty = metadata.find(prop => prop.name === 'single_date');
    const selectProperty = metadata.find(prop => prop.name === 'status_selection');

    expect(textProperty).toHaveProperty('translatedLabel', 'Simple Text EN');
    expect(dateProperty).toHaveProperty('translatedLabel', 'Single Date EN');
    expect(selectProperty).toHaveProperty('translatedLabel', 'Status Selection EN');
  });

  it('should use original label when translateLabels is false', async () => {
    const contextWithoutTranslation = {
      ...processingContext,
      translateLabels: false,
    };

    const processor = new AdapterEntityProcessor(contextWithoutTranslation);
    const result = processor.processEntity(rawEntity);
    const metadataWithoutTranslation = result.entity.metadata;

    const textProperty = metadataWithoutTranslation.find(prop => prop.name === 'simple_text');
    const dateProperty = metadataWithoutTranslation.find(prop => prop.name === 'single_date');

    expect(textProperty).toHaveProperty('translatedLabel', 'Simple Text');
    expect(dateProperty).toHaveProperty('translatedLabel', 'Single Date');
  });

  it('should include options for select property when includeOptions is true', async () => {
    const contextWithOptions = {
      ...processingContext,
      includeOptions: true,
    };

    const processor = new AdapterEntityProcessor(contextWithOptions);
    const result = processor.processEntity(rawEntity);
    const metadataWithOptions = result.entity.metadata;

    const selectPropertyWithOptions: SelectMetadataProperty = {
      name: 'status_selection',
      type: 'select',
      label: 'Status Selection',
      translatedLabel: 'Status Selection EN',
      values: [
        {
          value: 'thesaurus.again',
          label: 'Again',
        },
      ],
      _id: 'prop.status-selection',
      properties: {
        _id: 'prop.status-selection',
        inherited: false,
        options: [
          { value: 'thesaurus.acknowledging', label: 'Acknowledging' },
          { value: 'thesaurus.again', label: 'Again', selected: true },
          { value: 'thesaurus.expressing', label: 'Expressing' },
          { value: 'thesaurus.grouped', label: 'grouped' },
          {
            value: 'thesaurus.verb1',
            label: 'verb1',
            translatedLabel: 'verb1',
            selected: false,
            parent: { value: 'thesaurus.grouped', label: 'grouped' },
          },
          {
            value: 'thesaurus.verb2',
            label: 'verb2',
            translatedLabel: 'verb2',
            selected: false,
            parent: { value: 'thesaurus.grouped', label: 'grouped' },
          },
        ],
      },
    };

    expect(metadataWithOptions[7]).toMatchObject(selectPropertyWithOptions);
  });

  it('should include supporting files', () => {
    const contextWithOptions = {
      ...processingContext,
      includeSupportingFiles: true,
    };

    const processor = new AdapterEntityProcessor(contextWithOptions);
    const result = processor.processEntity(rawEntity);
    const { documents, attachments } = result.entity;

    expect(documents).toMatchObject([
      {
        _id: 'd1',
        creationDate: 1,
        entity: 'test-incident-001',
        filename: '16116590902796ifv9bxjnvk.pdf',
        language: 'en',
        mimetype: 'application/pdf',
        originalname: 'MockPDF.pdf',
        size: 1,
        status: 'ready',
        totalPages: 1,
        type: 'document',
      },
    ]);

    expect(attachments).toMatchObject([
      {
        _id: 'a1',
        creationDate: 1,
        entity: 'test-incident-001',
        filename: 'a1.jpg',
        mimetype: 'image/jpg',
        originalname: 'my_image.jpg',
        size: 1,
        type: 'attachment',
      },
    ]);
  });
});
