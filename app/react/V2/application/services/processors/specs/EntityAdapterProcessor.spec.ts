import { Entity, MetadataProperty } from 'app/V2/domain';
import {
  DateMetadataProperty,
  MultiDateMetadataProperty,
  SelectMetadataProperty,
  MultiSelectMetadataProperty,
  LinkMetadataProperty,
  GeneratedIdMetadataProperty,
} from 'app/V2/domain/entities/types';
import { processingContext, rawEntity } from './PropertyProcessorsFixtures';
import { EntityAdapterProcessor } from '../EntityAdapterProcessor';

describe('Simplified Processor Tests', () => {
  const entityAdapterProcessor = new EntityAdapterProcessor(processingContext);
  let entity: Entity;
  let restEntity: Omit<Entity, 'metadata'>;
  let metadata: MetadataProperty[];

  beforeAll(() => {
    const result = entityAdapterProcessor.processEntity(rawEntity);
    entity = result.entity;
    ({ metadata, ...restEntity } = entity);
  });

  it('should process entity data', async () => {
    const creationDate: DateMetadataProperty = {
      name: 'creationDate',
      type: 'date',
      label: 'creationDate',
      translatedLabel: 'creationDate',
      values: [
        {
          value: 1704067200,
          label: 'Jan 1, 2024',
          dateObject: new Date('2024-01-01T00:00:00.000Z'),
        },
      ],
    };

    const editDate: DateMetadataProperty = {
      name: 'editDate',
      type: 'date',
      label: 'editDate',
      translatedLabel: 'editDate',
      values: [
        {
          value: 1704153600,
          label: 'Jan 2, 2024',
          dateObject: new Date('2024-01-02T00:00:00.000Z'),
        },
      ],
    };

    const formattedTemplate = {
      _id: '68ddecdbc9474e23bb5e914b',
      name: 'Emergency Incident Report Template',
      label: 'Emergency Incident Report Template',
      color: '#C03B22',
      entityViewPage: '',
    };

    const expectedEntity: Omit<Entity, 'metadata'> = {
      _id: '68dded72c9474e23bb5e9254',
      title: 'Emergency Incident Report - Downtown Traffic Accident',
      template: formattedTemplate,
      sharedId: '36l0vr92qce',
      language: 'en',
      icon: undefined,
      creationDate: creationDate,
      editDate: editDate,
    };

    // Use toMatchObject with custom matchers for NaN values
    expect(restEntity).toMatchObject({
      _id: expectedEntity._id,
      title: expectedEntity.title,
      template: expectedEntity.template,
      sharedId: expectedEntity.sharedId,
      language: expectedEntity.language,
      icon: expectedEntity.icon,
    });

    // Test date properties separately to handle NaN comparison
    expect(restEntity.creationDate).toMatchObject({
      name: 'creationDate',
      type: 'date',
      label: 'Creation date',
    });
    expect(restEntity.creationDate.translatedLabel).toBeDefined();
    expect(restEntity.creationDate.values[0].value).toBeDefined();
    expect(restEntity.creationDate.values[0].label).toBeDefined();

    expect(restEntity.editDate).toMatchObject({
      name: 'editDate',
      type: 'date',
      label: 'Edit date',
    });
    expect(restEntity.editDate.translatedLabel).toBeDefined();
    expect(restEntity.editDate.values[0].value).toBeDefined();
    expect(restEntity.editDate.values[0].label).toBeDefined();
  });

  it('should process text property', async () => {
    const textProperty = {
      name: 'simple_text',
      type: 'text',
      label: 'Simple Text',
      translatedLabel: 'Simple Text',
      values: [
        {
          value: 'Emergency incident report from downtown area',
          label: 'Emergency incident report from downtown area',
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
      translatedLabel: 'Markdown Syntax',
      values: [
        {
          value:
            '# Emergency Incident Report\n## Incident Details\n### Location: Downtown Area\n\n**Incident Type:** Traffic Accident\n**Time:** 14:30\n**Status:** Under Investigation',
          label:
            '# Emergency Incident Report\n## Incident Details\n### Location: Downtown Area\n\n**Incident Type:** Traffic Accident\n**Time:** 14:30\n**Status:** Under Investigation',
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
      translatedLabel: 'Single Date',
      values: [{ value: 1759363200, label: 'Oct 2, 2025' }],
    };

    expect(metadata[2]).toMatchObject(dateProperty);
  });

  it('should process geolocation property', async () => {
    const geolocationProperty = {
      name: 'location_of_interest',
      type: 'geolocation',
      label: 'Location of Interest',
      translatedLabel: 'Location of Interest',
      values: [
        {
          value: {
            latitude: 46.3964365565104,
            longitude: 3.6694335937500004,
          },
          label: '46.40°N, 3.67°E',
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
      translatedLabel: 'Multiple Dates',
      values: [
        { value: 1759276800, label: 'Oct 1, 2025' },
        { value: 1759363200, label: 'Oct 2, 2025' },
        { value: 1759449600, label: 'Oct 3, 2025' },
      ],
    };

    expect(metadata[4]).toMatchObject(multipleDateProperty);
  });

  it('should process date range property', async () => {
    const dateRangeProperty = {
      name: 'date_range',
      type: 'daterange',
      label: 'Date Range',
      translatedLabel: 'Date Range',
      values: [{ value: { from: 1759276800, to: 1761955199 } }],
    };

    expect(metadata[5]).toMatchObject(dateRangeProperty);
  });

  it('should process multiple date range property', async () => {
    const multipleDateRangeProperty = {
      name: 'multiple_date_ranges',
      type: 'multidaterange',
      label: 'Multiple Date Ranges',
      translatedLabel: 'Multiple Date Ranges',
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
      translatedLabel: 'Status Selection',
      values: [
        {
          value: {
            label: 'Again',
            value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
          },
          label: 'Again',
          displayValue: 'Again',
        },
      ],
    };

    expect(metadata[7]).toMatchObject(selectProperty);
  });

  it('should process multiselect property', async () => {
    const multiselectProperty: MultiSelectMetadataProperty = {
      name: 'category_tags',
      type: 'multiselect',
      label: 'Category Tags',
      translatedLabel: 'Category Tags',
      values: [
        {
          displayValue: 'Acknowledging',
          icon: undefined,
          label: 'Acknowledging',
          url: undefined,
          value: {
            label: 'Acknowledging',
            value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
          },
        },
        {
          displayValue: 'Again',
          icon: undefined,
          label: 'Again',
          url: undefined,
          value: {
            label: 'Again',
            value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
          },
        },
        {
          displayValue: 'verb2',
          icon: undefined,
          label: 'verb2',
          url: undefined,
          value: {
            label: 'verb2',
            parent: {
              label: 'grouped',
              value: '68979984-35ac-4b98-abf9-28eac857749c',
            },
            value: '8c418311-1244-4777-800a-65729b8c17a8',
          },
        },
        {
          displayValue: 'verb1',
          icon: undefined,
          label: 'verb1',
          url: undefined,
          value: {
            label: 'verb1',
            parent: {
              label: 'grouped',
              value: '68979984-35ac-4b98-abf9-28eac857749c',
            },
            value: 'e1b9944b-43ef-4989-837b-b3df79284b00',
          },
        },
      ],
    };

    expect(metadata[8]).toMatchObject(multiselectProperty);
  });

  it('should process relationship property', async () => {
    const relationshipProperty = {
      name: 'related_people',
      type: 'relationship',
      label: 'Related People',
      translatedLabel: 'Related People',
      values: [
        {
          icon: { _id: 'ECU', label: 'Ecuador', type: 'Flags' },
          label: 'Maria Rodriguez - Witness',
          url: '/entity/xjku67dv7b',
          value: 'xjku67dv7b',
        },
        {
          icon: '',
          label: 'John Smith - Reporter',
          url: '/entity/4oklamamet',
          value: '4oklamamet',
        },
      ],
    };

    expect(metadata[9]).toMatchObject(relationshipProperty);
  });

  it('should process link property', async () => {
    const linkProperty: LinkMetadataProperty = {
      name: 'external_link',
      type: 'link',
      label: 'External Link',
      translatedLabel: 'External Link',
      values: [
        {
          label: 'Police Report',
          value: {
            label: 'Police Report',
            url: 'https://police.gov/reports/incident-2024-001',
          },
        },
      ],
    };

    expect(metadata[11]).toMatchObject(linkProperty);
  });

  it('should process image property', async () => {
    const imageProperty = {
      name: 'selected_image',
      type: 'image',
      label: 'Selected Image',
      translatedLabel: 'Selected Image',
      values: [
        {
          value: '/api/files/17593747059321ygqk22fdos.png',
          label: '17593747059321ygqk22fdos.png',
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
      translatedLabel: 'Preview Document',
      values: [
        {
          value: '',
          label: '[object Object]',
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
      translatedLabel: 'Video of Event',
      values: [
        {
          value: '/api/files/1759374705932xi5rx0mumef.mp4',
          label: '1759374705932xi5rx0mumef.mp4',
        },
      ],
    };

    expect(metadata[14]).toMatchObject(mediaProperty);
  });

  it('should process combined geolocation properties when combineGeolocation is true', async () => {
    const combinedGeolocationProperty = {
      name: 'incident_location',
      type: 'geolocation',
      label: 'Incident Location',
      translatedLabel: 'Incident Location',
      values: [
        {
          value: { latitude: 44.33301685687683, longitude: 5.998535156250001 },
          label: 'Incident Location',
          name: 'incident_location',
        },
        {
          value: { latitude: 62.58069554111894, longitude: 15.468750000000002 },
          label: 'Secondary Location',
          name: 'secondary_location',
        },
      ],
    };

    expect(metadata[15]).toMatchObject(combinedGeolocationProperty);
  });

  it('should process geolocationr property', async () => {
    const geolocationrProperty = {
      name: 'location_relationships',
      type: 'relationship',
      label: 'Location Relationships',
      translatedLabel: 'Location Relationships',
      values: [
        {
          value: 'xjku67dv7b',
          label: 'Witness Location - Maria Rodriguez',
        },
        {
          value: '4oklamamet',
          label: 'Reporter Location - John Smith',
        },
      ],
    };

    expect(metadata[16]).toMatchObject(geolocationrProperty);
  });

  it('should process relationship_nested property', async () => {
    const relationshipNestedProperty = {
      name: 'hierarchical_relationships',
      type: 'relationship',
      label: 'Hierarchical Relationships',
      translatedLabel: 'Hierarchical Relationships',
      values: [
        {
          icon: '',
          label: 'Emergency Response Team',
          url: '/entity/6qdshinfobf',
          value: '6qdshinfobf',
        },
      ],
    };

    expect(metadata[17]).toMatchObject(relationshipNestedProperty);
  });

  it('should process generatedid property', async () => {
    const generatedidProperty: GeneratedIdMetadataProperty = {
      name: 'document_id',
      type: 'generatedid',
      label: 'Document ID',
      translatedLabel: 'Document ID',
      values: [{ value: 'EVT-2024-001', label: 'EVT-2024-001' }],
    };

    expect(metadata[18]).toMatchObject(generatedidProperty);
  });

  it('should not combine geolocation properties when combineGeolocation is false', async () => {
    const nonCombiningContext = {
      ...processingContext,
      combineGeolocation: false,
    };
    const nonCombiningProcessor = new EntityAdapterProcessor(nonCombiningContext);
    const result = nonCombiningProcessor.processEntity(rawEntity);
    const nonCombiningMetadata = result.entity.metadata;

    const incidentLocationProperty = {
      name: 'incident_location',
      type: 'geolocation',
      label: 'Incident Location',
      translatedLabel: 'Incident Location',
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
      translatedLabel: 'Secondary Location',
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
    const editionProcessor = new EntityAdapterProcessor(editionContext);
    const result = editionProcessor.processEntity(rawEntity);
    const editionMetadata = result.entity.metadata;

    const incidentLocationProperty = {
      name: 'incident_location',
      type: 'geolocation',
      label: 'Incident Location',
      translatedLabel: 'Incident Location',
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
      translatedLabel: 'Secondary Location',
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
});
