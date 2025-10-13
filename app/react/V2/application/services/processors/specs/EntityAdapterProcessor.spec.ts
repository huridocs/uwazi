import { processingContext, rawEntity } from './PropertyProcessorsFixtures';
import { EntityAdapterProcessor } from '../EntityAdapterProcessor';
import { Entity, MetadataProperty } from 'app/V2/domain';
import {
  DateMetadataProperty,
  MultiDateMetadataProperty,
  SelectMetadataProperty,
  MultiSelectMetadataProperty,
  LinkMetadataProperty,
  GeneratedIdMetadataProperty,
} from 'app/V2/domain/entities/types';

describe('Simplified Processor Tests', () => {
  const entityAdapterProcessor = new EntityAdapterProcessor(processingContext);
  let entity: Entity;
  let restEntity: Omit<Entity, 'metadata'>;
  let metadata: MetadataProperty[];

  beforeAll(async () => {
    const result = await entityAdapterProcessor.processEntity(rawEntity);
    entity = result.entity;
    ({ metadata, ...restEntity } = entity);
  });

  it('should process entity data', async () => {
    const creationDate: DateMetadataProperty = {
      name: 'creationDate',
      type: 'date',
      label: 'creationDate',
      translatedLabel: 'creationDate',
      values: [{ value: 1759374706, label: 'Oct 2, 2025' }],
      dateObject: new Date('2025-10-02T03:11:46.000Z'),
    };

    const editDate: DateMetadataProperty = {
      name: 'editDate',
      type: 'date',
      label: 'editDate',
      translatedLabel: 'editDate',
      values: [{ value: 1760366924, label: 'Oct 13, 2025' }],
      dateObject: new Date('2025-10-13T14:48:44.000Z'),
    };

    const formattedTemplate = {
      _id: '68ddecdbc9474e23bb5e914b',
      name: 'Full template',
      label: 'Full template',
      color: '#C03B22',
      entityViewPage: '',
    };
    const expectedEntity: Omit<Entity, 'metadata'> = {
      _id: '68dded72c9474e23bb5e9254',
      title: 'Full entity',
      template: formattedTemplate,
      sharedId: '36l0vr92qce',
      language: 'en',
      creationDate: creationDate,
      editDate: editDate,
    };

    expect(restEntity).toMatchObject(expectedEntity);
  });

  it('should process text property', async () => {
    const textProperty = {
      name: 'text_label',
      type: 'text',
      label: 'Text Label',
      translatedLabel: 'Text Label',
      values: [{ value: 'Text1', label: 'Text1' }],
    };

    expect(metadata[0]).toMatchObject(textProperty);
  });

  it('should process markdown property', async () => {
    const markdownProperty = {
      name: 'markdown',
      type: 'markdown',
      label: 'Markdown',
      translatedLabel: 'Markdown',
      values: [
        {
          value: '# A first-level heading\n## A second-level heading\n### A third-level heading\n',
          label: '# A first-level heading\n## A second-level heading\n### A third-level heading\n',
        },
      ],
    };

    expect(metadata[1]).toMatchObject(markdownProperty);
  });

  it('should process date property', async () => {
    const dateProperty: DateMetadataProperty = {
      name: 'date',
      type: 'date',
      label: 'Date',
      translatedLabel: 'Date',
      values: [{ value: 1759363200, label: 'Oct 2, 2025' }],
    };

    expect(metadata[2]).toMatchObject(dateProperty);
  });

  it('should process geolocation property', async () => {
    const geolocationProperty = {
      name: 'geolocationisolated_geolocation',
      type: 'geolocation',
      label: 'GeolocationIsolated',
      translatedLabel: 'GeolocationIsolated',
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
      name: 'multidate',
      type: 'multidate',
      label: 'Multidate',
      translatedLabel: 'Multidate',
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
      name: 'daterange',
      type: 'daterange',
      label: 'Daterange',
      translatedLabel: 'Daterange',
      values: [{ value: { from: 1759276800, to: 1761955199 } }],
    };

    expect(metadata[5]).toMatchObject(dateRangeProperty);
  });

  it('should process multiple date range property', async () => {
    const multipleDateRangeProperty = {
      name: 'multidaterange',
      type: 'multidaterange',
      label: 'Multidaterange',
      translatedLabel: 'Multidaterange',
      values: [
        { value: { from: 1759276800, to: 1759449599 } },
        { value: { from: 1759363200, to: 1759535999 } },
      ],
    };

    expect(metadata[6]).toMatchObject(multipleDateRangeProperty);
  });

  it('should process select property', async () => {
    const selectProperty: SelectMetadataProperty = {
      name: 'select',
      type: 'select',
      label: 'Select',
      translatedLabel: 'Select',
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
      name: 'multiselect',
      type: 'multiselect',
      label: 'Multiselect',
      translatedLabel: 'Multiselect',
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
      name: 'relationship',
      type: 'relationship',
      label: 'Relationship',
      translatedLabel: 'Relationship',
      values: [
        {
          icon: { _id: 'ECU', label: 'Ecuador', type: 'Flags' },
          label: 'Context trimming sample2',
          url: '/entity/xjku67dv7b',
          value: 'xjku67dv7b',
        },
        {
          icon: '',
          label: 'Context trimming sample3',
          url: '/entity/4oklamamet',
          value: '4oklamamet',
        },
      ],
    };

    expect(metadata[9]).toMatchObject(relationshipProperty);
  });

  it('should process link property', async () => {
    const linkProperty: LinkMetadataProperty = {
      name: 'link',
      type: 'link',
      label: 'Link',
      translatedLabel: 'Link',
      values: [
        {
          label: 'google',
          value: {
            label: 'google',
            url: 'www.google.com',
          },
        },
      ],
    };

    expect(metadata[11]).toMatchObject(linkProperty);
  });

  it('should process image property', async () => {
    const imageProperty = {
      name: 'image',
      type: 'image',
      label: 'Image',
      translatedLabel: 'Image',
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
      name: 'preview',
      type: 'preview',
      label: 'Preview',
      translatedLabel: 'Preview',
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
      name: 'media',
      type: 'media',
      label: 'Media',
      translatedLabel: 'Media',
      values: [
        {
          value: '/api/files/1759374705932xi5rx0mumef.mp4',
          label: '1759374705932xi5rx0mumef.mp4',
        },
      ],
    };

    expect(metadata[14]).toMatchObject(mediaProperty);
  });

  it('should process geolocation_geolocation property', async () => {
    const geolocationProperty = {
      name: 'geolocation_geolocation',
      type: 'geolocation',
      label: 'Geolocation',
      translatedLabel: 'Geolocation',
      values: [
        {
          value: {
            latitude: 44.33301685687683,
            longitude: 5.998535156250001,
          },
          label: '44.33°N, 6.00°E',
        },
      ],
    };

    expect(metadata[15]).toMatchObject(geolocationProperty);
  });

  it('should process geolocation2_geolocation property', async () => {
    const geolocation2Property = {
      name: 'geolocation2_geolocation',
      type: 'geolocation',
      label: 'Geolocation2',
      translatedLabel: 'Geolocation2',
      values: [
        {
          value: {
            latitude: 62.58069554111894,
            longitude: 15.468750000000002,
          },
          label: '62.58°N, 15.47°E',
        },
      ],
    };

    expect(metadata[16]).toMatchObject(geolocation2Property);
  });

  it('should process geolocationr property', async () => {
    const geolocationrProperty = {
      name: 'geolocationr',
      type: 'relationship',
      label: 'GeolocationR',
      translatedLabel: 'GeolocationR',
      values: [
        {
          icon: { _id: 'ECU', label: 'Ecuador', type: 'Flags' },
          label: 'Context trimming sample2',
          url: '/entity/xjku67dv7b',
          value: 'xjku67dv7b',
        },
        {
          icon: '',
          label: 'Context trimming sample3',
          url: '/entity/4oklamamet',
          value: '4oklamamet',
        },
      ],
    };

    expect(metadata[17]).toMatchObject(geolocationrProperty);
  });

  it('should process relationship_nested property', async () => {
    const relationshipNestedProperty = {
      name: 'relationship_n-3',
      type: 'relationship',
      label: 'Relationship n-3',
      translatedLabel: 'Relationship n-3',
      values: [
        {
          icon: '',
          label: 'Middle1',
          url: '/entity/6qdshinfobf',
          value: '6qdshinfobf',
        },
      ],
    };

    expect(metadata[19]).toMatchObject(relationshipNestedProperty);
  });

  it('should process generatedid property', async () => {
    const generatedidProperty: GeneratedIdMetadataProperty = {
      name: 'generatedid',
      type: 'generatedid',
      label: 'Generatedid',
      translatedLabel: 'Generatedid',
      values: [{ value: 'BDZ3505-3650', label: 'BDZ3505-3650' }],
    };

    expect(metadata[18]).toMatchObject(generatedidProperty);
  });
});
