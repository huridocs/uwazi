import { ClientTemplateSchema } from '#V2/shared/types.js';
import { formatMetadataFields } from '../formatMetadataFields.js';

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

  describe('geolocation properties', () => {
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
            { _id: 'geo-a', name: 'locationA', label: 'Location A' },
            { _id: 'geo-b', name: 'locationB', label: 'Location B' },
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

    it('should include relationships with geolocation inheritance into the groups', () => {
      const template = {
        properties: [
          { _id: 'geo-a', name: 'locationA', label: 'Location A', type: 'geolocation' },
          {
            _id: 'rel1',
            type: 'relationship',
            label: 'Rel 1',
            name: 'rel_1',
            content: '69f0a4ac62c282d87ef5970f',
            inherit: {
              property: 'x',
              type: 'geolocation',
            },
          },
        ],
      } as ClientTemplateSchema;

      expect(formatMetadataFields(template, { groupGeolocationProperties: true })).toEqual([
        {
          _id: 'group1',
          name: '__group1',
          label: '__group1',
          type: 'geolocation',
          inherited: false,
          inheritedType: undefined,
          propertyGroup: [
            { _id: 'geo-a', name: 'locationA', label: 'Location A' },
            {
              _id: 'rel1',
              name: 'rel_1',
              label: 'Rel 1',
              inherited: true,
              content: '69f0a4ac62c282d87ef5970f',
              property: 'x',
            },
          ],
        },
      ]);
    });

    it('should group contiguous own and inherited geolocation properties in a single group', () => {
      const template = {
        properties: [
          { _id: 'geo-b', name: 'locationB', label: 'Location B', type: 'geolocation' },
          {
            _id: 'rel1',
            type: 'relationship',
            label: 'Rel 1',
            name: 'rel_1',
            content: '69f0a4ac62c282d87ef5970f',
            inherit: {
              property: 'x',
              type: 'geolocation',
            },
          },
          { _id: 'geo-a', name: 'locationA', label: 'Location A', type: 'geolocation' },
        ],
      } as ClientTemplateSchema;

      expect(formatMetadataFields(template, { groupGeolocationProperties: true })).toEqual([
        {
          _id: 'group1',
          name: '__group1',
          label: '__group1',
          type: 'geolocation',
          propertyGroup: [
            { _id: 'geo-b', name: 'locationB', label: 'Location B' },
            {
              _id: 'rel1',
              name: 'rel_1',
              label: 'Rel 1',
              inherited: true,
              content: '69f0a4ac62c282d87ef5970f',
              property: 'x',
            },
            { _id: 'geo-a', name: 'locationA', label: 'Location A' },
          ],
          inherited: false,
          inheritedType: undefined,
        },
      ]);
    });
  });

  it('should pass denormalizedProperty for newRelationship template fields', () => {
    const template = {
      properties: [
        {
          _id: 'nr1',
          name: 'refs',
          label: 'Refs',
          type: 'newRelationship',
          denormalizedProperty: 'target_prop',
        },
      ],
    } as ClientTemplateSchema;

    expect(formatMetadataFields(template)).toEqual([
      {
        _id: 'nr1',
        name: 'refs',
        label: 'Refs',
        type: 'newRelationship',
        inherited: false,
        inheritedType: undefined,
        denormalizedProperty: 'target_prop',
        hideLabel: undefined,
      },
    ]);
  });
});
