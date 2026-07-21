import type { Entity } from '#V2/api/entities/types.js';
import { formatLinkProperty } from '../formatLinkProperty';
import { BaseMetadataProperty } from '../../types';

describe('formatLinkProperty', () => {
  const metadata = {
    link1: [
      {
        value: {
          label: 'test1',
          url: 'google.com',
        },
      },
    ],
    link2: [
      {
        value: {
          url: 'google.com',
        },
      },
    ],
    linkMulti: [
      {
        value: {
          label: 'first',
          url: 'https://first.example.com',
        },
      },
      {
        value: {
          label: 'second',
          url: 'https://second.example.com',
        },
      },
    ],
    inheritedLink: [
      {
        value: 'entity-1',
        inheritedType: 'relationship',
        inheritedValue: [
          {
            value: 'entity-2',
            inheritedType: 'link',
            inheritedValue: [
              {
                value: { label: 'nested link', url: 'https://nested.example.com' },
              },
            ],
          },
        ],
      },
    ],
  } as Entity['metadata'];

  it('should format the link property', () => {
    const textProperty = {
      _id: 'p1',
      name: 'link1',
      label: 'Link 1',
      type: 'link',
    } as BaseMetadataProperty;

    expect(formatLinkProperty(textProperty, metadata)).toEqual({
      _id: 'p1',
      name: 'link1',
      type: 'link',
      values: [{ value: 'google.com', label: 'test1' }],
      label: 'Link 1',
    });
  });

  it('should work with no label', () => {
    const textProperty = {
      _id: 'p1',
      name: 'link2',
      label: 'Link 2',
      type: 'link',
    } as BaseMetadataProperty;

    expect(formatLinkProperty(textProperty, metadata)).toEqual({
      _id: 'p1',
      name: 'link2',
      type: 'link',
      values: [{ value: 'google.com', label: '' }],
      label: 'Link 2',
    });
  });

  it('should return empty values when metadata array is empty', () => {
    const textProperty = {
      _id: 'p1',
      name: 'link3',
      label: 'Link 3',
      type: 'link',
    } as BaseMetadataProperty;

    expect(formatLinkProperty(textProperty, { link3: [] } as Entity['metadata'])).toEqual({
      _id: 'p1',
      name: 'link3',
      type: 'link',
      values: [],
      label: 'Link 3',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should return empty values when metadata is undefined', () => {
    const textProperty = {
      _id: 'p1',
      name: 'link3',
      label: 'Link 3',
      type: 'link',
    } as BaseMetadataProperty;

    expect(formatLinkProperty(textProperty, undefined)).toEqual({
      _id: 'p1',
      name: 'link3',
      type: 'link',
      values: [],
      label: 'Link 3',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should keep all link values', () => {
    const textProperty = {
      _id: 'p2',
      name: 'linkMulti',
      label: 'Link Multi',
      type: 'link',
    } as BaseMetadataProperty;

    expect(formatLinkProperty(textProperty, metadata)).toEqual({
      _id: 'p2',
      name: 'linkMulti',
      type: 'link',
      values: [
        { value: 'https://first.example.com', label: 'first' },
        { value: 'https://second.example.com', label: 'second' },
      ],
      label: 'Link Multi',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should format inherited relationship values when they resolve to links', () => {
    const property = {
      _id: 'p3',
      name: 'inheritedLink',
      label: 'Inherited Link',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
    } as BaseMetadataProperty;

    expect(formatLinkProperty(property, metadata)).toEqual({
      _id: 'p3',
      name: 'inheritedLink',
      type: 'link',
      values: [{ value: 'https://nested.example.com', label: 'nested link' }],
      label: 'Inherited Link',
      inherited: true,
      inheritedType: 'relationship',
    });
  });
});
