import { Entity } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatImageProperty } from '../formatImageProperty.js';

describe('formatImageProperty', () => {
  it('should format preview property with alt and cover style when fullWidth is enabled', () => {
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
      properties: [{ name: 'preview_document', fullWidth: true }],
    } as ClientTemplateSchema;

    expect(formatImageProperty(property, metadata, template)).toEqual({
      _id: 'p1',
      name: 'preview_document',
      label: 'Preview document',
      type: 'preview',
      values: [{ value: '/api/files/test-preview.png', alt: '/api/files/test-preview.png' }],
      style: 'cover',
    });
  });

  it('should return empty values when metadata array is empty', () => {
    const property = {
      _id: 'p1',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
    } as BaseMetadataProperty;

    const metadata = { related_images: [] } as Entity['metadata'];

    expect(formatImageProperty(property, metadata)).toEqual({
      _id: 'p1',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
      values: [],
      style: 'contain',
    });
  });

  it('should return empty values when metadata is undefined', () => {
    const property = {
      _id: 'p1',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
    } as BaseMetadataProperty;

    expect(formatImageProperty(property, undefined)).toEqual({
      _id: 'p1',
      name: 'related_images',
      label: 'Related images',
      type: 'image',
      values: [],
      style: 'contain',
    });
  });
});
