import type { Entity } from '#app/V2/api/entities/types.js';
import { formatLinkProperty } from '../Formatters';
import { BaseMetadataProperty } from '../MetadataPropertiesType';

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
});
