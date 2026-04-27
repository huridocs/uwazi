import { ClientTemplateSchema } from '#V2/shared/types.js';
import { formatMetadataFields } from '../Formatters/index.js';

const templateA = {
  properties: [
    { _id: 'p-title-a', name: 'title', label: 'Title', type: 'text' },
    {
      _id: 'p-source-a',
      name: 'sourceA',
      label: 'Source A',
      type: 'relationship',
      content: 'templateA',
      inherit: { property: 'x', type: 'text' },
    },
  ],
} as ClientTemplateSchema;

const templateB = {
  properties: [
    { _id: 'p-title-b', name: 'title', label: 'Title B', type: 'text' },
    {
      _id: 'p-source-b',
      name: 'sourceB',
      label: 'Source B',
      type: 'relationship',
      content: 'templateB',
      inherit: { property: 'y', type: 'date' },
    },
  ],
} as ClientTemplateSchema;

describe('formatMetadataFields ', () => {
  it('should return an empty array when metadata there is no properties', () => {
    expect(formatMetadataFields(undefined)).toEqual([]);
  });

  it('should return properties formatted', () => {
    expect(formatMetadataFields(templateA)).toEqual([
      {
        _id: 'p-title-a',
        name: 'title',
        label: 'Title',
        type: 'text',
        inherited: false,
        inheritedType: undefined,
      },
      {
        _id: 'p-source-a',
        name: 'sourceA',
        label: 'Source A',
        type: 'relationship',
        inherited: true,
        inheritedType: 'text',
        relationShipTarget: 'templateA',
      },
    ]);

    expect(formatMetadataFields(templateB)).toEqual([
      {
        _id: 'p-title-b',
        name: 'title',
        label: 'Title B',
        type: 'text',
        inherited: false,
        inheritedType: undefined,
      },
      {
        _id: 'p-source-b',
        name: 'sourceB',
        label: 'Source B',
        type: 'relationship',
        inherited: true,
        inheritedType: 'date',
        relationShipTarget: 'templateB',
      },
    ]);
  });

  it('should format with inheritance info from template', () => {
    const template = {
      properties: [
        {
          _id: 'p-from-template',
          name: 'fromTemplate',
          label: 'From Template',
          type: 'relationship',
          inherit: { property: 'z', type: 'text' },
          content: 'someId',
        },
      ],
    } as ClientTemplateSchema;

    expect(formatMetadataFields(template)).toEqual([
      {
        _id: 'p-from-template',
        name: 'fromTemplate',
        label: 'From Template',
        type: 'relationship',
        inherited: true,
        inheritedType: 'text',
        relationShipTarget: 'someId',
      },
    ]);
  });

  it('should group adjacent geolocation properties when groupGeolocationProperties is true', () => {
    const template = {
      properties: [
        { _id: 'geo-a', name: 'locationA', label: 'Location A', type: 'geolocation' },
        { _id: 'geo-b', name: 'locationB', label: 'Location B', type: 'geolocation' },
        { _id: 'txt-a', name: 'summary', label: 'Summary', type: 'text' },
        { _id: 'geo-c', name: 'locationC', label: 'Location C', type: 'geolocation' },
      ],
    } as ClientTemplateSchema;

    expect(formatMetadataFields(template, { groupGeolocationProperties: true })).toEqual([
      {
        _id: 'group1',
        name: '__group1',
        label: '__group1',
        type: 'geolocation',
        propertyGroup: [
          { name: 'locationA', label: 'Location A' },
          { name: 'locationB', label: 'Location B' },
        ],
        inherited: false,
        inheritedType: undefined,
      },
      {
        _id: 'txt-a',
        name: 'summary',
        label: 'Summary',
        type: 'text',
        inherited: false,
        inheritedType: undefined,
      },
      {
        _id: 'geo-c',
        name: 'locationC',
        label: 'Location C',
        type: 'geolocation',
        inherited: false,
        inheritedType: undefined,
      },
    ]);
  });

  it('should format inheritedTarget for relationship properties from content', () => {
    const template = {
      properties: [
        {
          _id: 'rel-target',
          name: 'related_people',
          label: 'Related People',
          type: 'relationship',
          content: 'template-people',
        },
      ],
    } as ClientTemplateSchema;

    expect(formatMetadataFields(template)).toEqual([
      {
        _id: 'rel-target',
        name: 'related_people',
        label: 'Related People',
        type: 'relationship',
        inherited: false,
        relationShipTarget: 'template-people',
      },
    ]);
  });
});
