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
});
