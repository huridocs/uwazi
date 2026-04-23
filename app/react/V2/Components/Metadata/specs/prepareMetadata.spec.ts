import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { prepareMetadata } from '../Formatters/index.js';

const metadata = {
  title: [{ value: 'A title' }],
  sourceA: [{ value: 'Only for template A' }],
  sourceB: [{ value: 'Only for template B' }],
  orphan: [{ value: 'Should be ignored' }],
} as Entity['metadata'];

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

const templateC = {
  properties: [{ _id: 'p-title', name: 'title', label: 'Title', type: 'text' }],
} as ClientTemplateSchema;

const templateD = {
  commonProperties: [{ name: 'title', label: 'Title' }],
} as ClientTemplateSchema;

describe('prepareMetadata', () => {
  it('should return an empty array when metadata is missing, or theres no template, or no properties', () => {
    expect(prepareMetadata(undefined, templateC)).toEqual([]);
    expect(prepareMetadata(metadata, undefined)).toEqual([]);
    expect(prepareMetadata(metadata, templateD)).toEqual([]);
  });

  it('should return only properties that exist in the provided template', () => {
    expect(prepareMetadata(metadata, templateA)).toEqual([
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

    expect(prepareMetadata(metadata, templateB)).toEqual([
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

  it('should ignore template properties without _id and use inherit info from template', () => {
    const metadata = {
      noId: [{ value: 'no id value' }],
      fromTemplate: [{ value: 'value', inheritedType: 'date' }],
    } as Entity['metadata'];

    const template = {
      properties: [
        { name: 'noId', label: 'No Id', type: 'text' },
        {
          _id: 'p-from-template',
          name: 'fromTemplate',
          label: 'From Template',
          type: 'relationship',
          inherit: { property: 'z', type: 'text' },
        },
      ],
    } as ClientTemplateSchema;

    expect(prepareMetadata(metadata, template)).toEqual([
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
