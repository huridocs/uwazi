import { Entity, MetadataProperty } from 'app/V2/domain';
import {
  DateMetadataProperty,
  MultiDateMetadataProperty,
  SelectMetadataProperty,
  MultiSelectMetadataProperty,
  LinkMetadataProperty,
} from 'app/V2/domain/entities/types';
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
      _id: '68ddecdbc9474e23bb5e914b',
      name: 'Emergency Incident Report Template',
      label: 'Emergency Incident Report Template EN',
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
          value: 'Emergency incident report from downtown area',
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
          value:
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
      translatedLabel: 'Single Date EN',
      values: [{ value: 1759363200, label: 'Oct 2, 2025' }],
      _id: '68ddecdbc9474e23bb5e914e',
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
      _id: '68ddecdbc9474e23bb5e914f',
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
          value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
          label: 'Again',
        },
      ],
      _id: '68ddecdbc9474e23bb5e9151',
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
          value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
          label: 'Acknowledging',
        },
        {
          value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
          label: 'Again',
        },
        {
          value: '8c418311-1244-4777-800a-65729b8c17a8',
          label: 'verb2',
          parent: {
            label: 'grouped',
            value: '68979984-35ac-4b98-abf9-28eac857749c',
          },
        },
        {
          value: 'e1b9944b-43ef-4989-837b-b3df79284b00',
          label: 'verb1',
          parent: {
            label: 'grouped',
            value: '68979984-35ac-4b98-abf9-28eac857749c',
          },
        },
      ],
      _id: '68ddecdbc9474e23bb5e9152',
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
          value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
          label: 'Again',
          source: {
            icon: 'ECU',
            label: 'Maria Rodriguez - Witness',
            url: '/entity/xjku67dv7b',
            value: 'xjku67dv7b',
          },
        },
        {
          value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
          label: 'Acknowledging',
          source: {
            icon: 'ECU',
            label: 'Maria Rodriguez - Witness',
            url: '/entity/xjku67dv7b',
            value: 'xjku67dv7b',
          },
        },
        {
          value: '6c744926-bf38-4f98-8c74-cf6b7280863c',
          label: 'Expressing',
          source: {
            value: '4oklamamet',
            label: 'John Smith - Reporter',
            url: '/entity/4oklamamet',
          },
        },
        {
          value: '8c418311-1244-4777-800a-65729b8c17a8',
          label: 'verb2',
          parent: {
            value: '68979984-35ac-4b98-abf9-28eac857749c',
            label: 'grouped',
          },
          source: {
            value: '4oklamamet',
            label: 'John Smith - Reporter',
            url: '/entity/4oklamamet',
          },
        },
      ],
      properties: {
        inherited: true,
        inheritedProperty: {
          type: 'multiselect',
          label: 'Multiselect',
          name: 'category_tags',
          translatedLabel: 'Multiselect',
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
      _id: '68ddecdbc9474e23bb5e9154',
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
          value: '/api/files/17593747059321ygqk22fdos.png',
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
          value: '',
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
          value: '/api/files/1759374705932xi5rx0mumef.mp4',
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
            value: 'xjku67dv7b',
            label: 'Witness Location - Maria Rodriguez',
            color: '#16bdca',
            icon: 'ECU',
            type: 'entity',
            inheritedType: 'geolocation',
            url: '/entity/xjku67dv7b',
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
          value: '9e22a1af-75d7-49a2-b9d8-9ec77939b630',
          label: 'Again',
          source: {
            value: '7jdr88mnow6',
            label: 'First Responders',
            url: '/entity/7jdr88mnow6',
          },
        },
        {
          value: '765ab6ca-56a1-4948-9dc9-17fc0aa30843',
          label: 'Acknowledging',
          source: {
            value: '7jdr88mnow6',
            label: 'First Responders',
            url: '/entity/7jdr88mnow6',
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
});
