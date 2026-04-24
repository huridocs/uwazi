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
      },
    ]);
  });
});
