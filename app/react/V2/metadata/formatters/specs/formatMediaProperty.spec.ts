import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatMediaProperty } from '../formatMediaProperty.js';

describe('formatMediaProperty', () => {
  const mediaProperty = {
    _id: '1.15',
    name: 'media',
    label: 'Media',
    type: 'media',
  } as BaseMetadataProperty;

  it('should parse media timelinks payload and include processed timelinks', () => {
    const metadata = {
      media: [
        {
          value:
            '(/api/files/17774660700503j7omunsid6.mp4, {"timelinks":{"00:00:00":"","00:01:33":"Test 1"}})',
        },
      ],
    } as Entity['metadata'];

    expect(formatMediaProperty(mediaProperty, metadata)).toEqual({
      _id: '1.15',
      name: 'media',
      type: 'media',
      values: [
        {
          value: '/api/files/17774660700503j7omunsid6.mp4',
          alt: '17774660700503j7omunsid6.mp4',
          mimetype: 'video/mp4',
          fileType: 'video',
          timelinks: [
            {
              label: '',
              hh: 0,
              mm: 0,
              ss: 0,
              time: 0,
            },
            {
              label: 'Test 1',
              hh: 0,
              mm: 1,
              ss: 33,
              time: 93,
            },
          ],
        },
      ],
      label: 'Media',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should keep regular file URLs as plain values', () => {
    const metadata = {
      media: [
        {
          value: '/api/files/1777466473694conud25rxzq.webm',
        },
      ],
    } as Entity['metadata'];

    expect(formatMediaProperty(mediaProperty, metadata)).toEqual({
      _id: '1.15',
      name: 'media',
      type: 'media',
      values: [
        {
          value: '/api/files/1777466473694conud25rxzq.webm',
          timelinks: [],
        },
      ],
      label: 'Media',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should keep external URLs as plain values', () => {
    const metadata = {
      media: [
        {
          value: 'https://www.youtube.com/watch?v=RpJBHCc9VwM',
        },
      ],
    } as Entity['metadata'];

    expect(formatMediaProperty(mediaProperty, metadata)).toEqual({
      _id: '1.15',
      name: 'media',
      type: 'media',
      values: [
        {
          value: 'https://www.youtube.com/watch?v=RpJBHCc9VwM',
          timelinks: [],
        },
      ],
      label: 'Media',
      inherited: undefined,
      inheritedType: undefined,
    });
  });
});
