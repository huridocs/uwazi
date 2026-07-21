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

  const inheritedMediaProperty = {
    _id: '1.16',
    name: 'inherited_media',
    label: 'Inherited Media',
    type: 'relationship',
    inherited: true,
    inheritedType: 'relationship',
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

  it('should keep all media values and preserve timelinks per item', () => {
    const metadata = {
      media: [
        {
          value:
            '(/api/files/video-one.mp4, {"timelinks":{"00:00:02":"Timelink 1","00:00:04":"Timelink 2"}})',
        },
        {
          value: '/api/files/video-two.webm',
        },
      ],
    } as Entity['metadata'];

    expect(formatMediaProperty(mediaProperty, metadata)).toEqual({
      _id: '1.15',
      name: 'media',
      type: 'media',
      values: [
        {
          value: '/api/files/video-one.mp4',
          alt: 'video-one.mp4',
          mimetype: 'video/mp4',
          fileType: 'video',
          timelinks: [
            {
              label: 'Timelink 1',
              hh: 0,
              mm: 0,
              ss: 2,
              time: 2,
            },
            {
              label: 'Timelink 2',
              hh: 0,
              mm: 0,
              ss: 4,
              time: 4,
            },
          ],
        },
        {
          value: '/api/files/video-two.webm',
          timelinks: [],
        },
      ],
      label: 'Media',
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

  it('should return empty values when metadata array is empty', () => {
    const metadata = { media: [] } as Entity['metadata'];

    expect(formatMediaProperty(mediaProperty, metadata)).toEqual({
      _id: '1.15',
      name: 'media',
      type: 'media',
      values: [],
      label: 'Media',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should return empty values when metadata is undefined', () => {
    expect(formatMediaProperty(mediaProperty, undefined)).toEqual({
      _id: '1.15',
      name: 'media',
      type: 'media',
      values: [],
      label: 'Media',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should format inherited relationship values when they resolve to media', () => {
    const metadata = {
      inherited_media: [
        {
          value: 'entity-1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              value: 'entity-2',
              inheritedType: 'media',
              inheritedValue: [
                {
                  value:
                    '(/api/files/inherited-video.mp4, {"timelinks":{"00:00:03":"Nested link"}})',
                },
              ],
            },
          ],
        },
      ],
    } as Entity['metadata'];

    expect(formatMediaProperty(inheritedMediaProperty, metadata)).toEqual({
      _id: '1.16',
      name: 'inherited_media',
      type: 'media',
      values: [
        {
          value: '/api/files/inherited-video.mp4',
          alt: 'inherited-video.mp4',
          mimetype: 'video/mp4',
          fileType: 'video',
          timelinks: [
            {
              label: 'Nested link',
              hh: 0,
              mm: 0,
              ss: 3,
              time: 3,
            },
          ],
        },
      ],
      label: 'Inherited Media',
      inherited: true,
      inheritedType: 'relationship',
    });
  });
});
