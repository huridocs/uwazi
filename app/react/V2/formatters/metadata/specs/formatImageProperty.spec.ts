import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatImageProperty } from '../formatImageProperty.js';

const imageProperty = {
  _id: 'p2',
  name: 'related_images',
  label: 'Related images',
  type: 'image',
} as BaseMetadataProperty;

describe('formatImageProperty', () => {
  it('uses template contain as Fit and cover as Fill', () => {
    const property = {
      _id: 'p1',
      name: 'photo',
      label: 'Photo',
      type: 'image',
    } as BaseMetadataProperty;

    const metadata = {
      photo: [{ value: '/api/files/photo.png' }],
    } as Entity['metadata'];

    const fit = {
      properties: [{ name: 'photo', style: 'contain', fullWidth: true }],
    } as ClientTemplateSchema;

    const fill = {
      properties: [{ name: 'photo', style: 'cover', fullWidth: false }],
    } as ClientTemplateSchema;

    expect(formatImageProperty(property, metadata, { template: fit })).toEqual({
      _id: 'p1',
      name: 'photo',
      label: 'Photo',
      type: 'image',
      values: [{ value: '/api/files/photo.png', alt: '/api/files/photo.png' }],
      style: 'contain',
      fullWidth: true,
    });

    expect(formatImageProperty(property, metadata, { template: fill })).toEqual({
      _id: 'p1',
      name: 'photo',
      label: 'Photo',
      type: 'image',
      values: [{ value: '/api/files/photo.png', alt: '/api/files/photo.png' }],
      style: 'cover',
      fullWidth: false,
    });
  });

  it('defaults to cover when style is missing or invalid', () => {
    const metadata = {
      related_images: [{ value: '/api/files/image-1.png' }],
    } as Entity['metadata'];

    const template = {
      properties: [{ name: 'related_images', style: 'fill', fullWidth: true }],
    } as ClientTemplateSchema;

    expect(formatImageProperty(imageProperty, metadata, { template })?.style).toBe('cover');
    expect(formatImageProperty(imageProperty, metadata)?.style).toBe('cover');
  });

  it('should format preview property with alt from template style', () => {
    const property = {
      _id: 'p1',
      name: 'preview_document',
      label: 'Preview document',
      type: 'preview',
    } as BaseMetadataProperty;

    const metadata = {
      preview_document: [{ value: '/api/files/test-preview.png' }],
    } as Entity['metadata'];

    const template = {
      properties: [{ name: 'preview_document', style: 'contain', fullWidth: true }],
    } as ClientTemplateSchema;

    expect(formatImageProperty(property, metadata, { template })).toEqual({
      _id: 'p1',
      name: 'preview_document',
      label: 'Preview document',
      type: 'preview',
      values: [{ value: '/api/files/test-preview.png', alt: 'Preview document' }],
      style: 'contain',
      fullWidth: true,
    });
  });

  it('should use entity preview when preview metadata is empty', () => {
    const property = {
      _id: 'p1',
      name: 'preview_document',
      label: 'Preview document',
      type: 'preview',
    } as BaseMetadataProperty;

    const entity = { preview: 'doc-preview.jpg' } as Entity;

    expect(formatImageProperty(property, {}, { entity })).toEqual({
      _id: 'p1',
      name: 'preview_document',
      label: 'Preview document',
      type: 'preview',
      values: [{ value: '/api/files/doc-preview.jpg', alt: 'Preview document' }],
      style: 'cover',
      fullWidth: false,
    });
  });

  it('should return empty values when metadata array is empty', () => {
    const metadata = { related_images: [] } as Entity['metadata'];

    expect(formatImageProperty(imageProperty, metadata)).toEqual({
      _id: 'p2',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
      values: [],
      style: 'cover',
      fullWidth: false,
    });
  });

  it('should return empty values when metadata is undefined', () => {
    expect(formatImageProperty(imageProperty, undefined)).toEqual({
      _id: 'p2',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
      values: [],
      style: 'cover',
      fullWidth: false,
    });
  });

  it('should keep all image values', () => {
    const metadata = {
      related_images: [{ value: '/api/files/image-1.png' }, { value: '/api/files/image-2.png' }],
    } as Entity['metadata'];

    expect(formatImageProperty(imageProperty, metadata)).toEqual({
      _id: 'p2',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
      values: [
        { value: '/api/files/image-1.png', alt: '/api/files/image-1.png' },
        { value: '/api/files/image-2.png', alt: '/api/files/image-2.png' },
      ],
      style: 'cover',
      fullWidth: false,
    });
  });

  it('should format inherited relationship values when they resolve to image/preview', () => {
    const property = {
      _id: 'p3',
      name: 'inherited_images',
      label: 'Inherited images',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
    } as BaseMetadataProperty;

    const metadata = {
      inherited_images: [
        {
          value: 'entity-1',
          inheritedType: 'relationship',
          inheritedValue: [
            {
              value: 'entity-2',
              inheritedType: 'image',
              inheritedValue: [{ value: '/api/files/inherited-image.png' }],
            },
          ],
        },
      ],
    } as Entity['metadata'];

    expect(formatImageProperty(property, metadata)).toEqual({
      _id: 'p3',
      name: 'inherited_images',
      label: 'Inherited images',
      type: 'image',
      values: [{ value: '/api/files/inherited-image.png', alt: '/api/files/inherited-image.png' }],
      style: 'cover',
      fullWidth: false,
    });
  });
});
