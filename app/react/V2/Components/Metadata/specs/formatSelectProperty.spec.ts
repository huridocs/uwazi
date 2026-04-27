import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';
import { formatSelectProperty } from '../Formatters/formatSelectProperty.js';

describe('formatSelectProperty', () => {
  const metadata = {
    single_select: [{ value: 's1', label: 'Option 1' }],
    multi_select: [
      { value: 'm1', label: 'Option A', parent: { value: 'p1', label: 'Parent A' } },
      { value: 'm2', label: 'Option B' },
    ],
    empty_values: [
      { value: '', label: '' },
      { value: undefined, label: undefined },
    ],
    empty_array: [],
  } as Entity['metadata'];

  it('should prepare select properties', () => {
    const property = {
      _id: 's1',
      name: 'single_select',
      label: 'Single Select',
      type: 'select',
    } as BaseMetadataProperty;

    expect(formatSelectProperty(property, metadata)).toEqual({
      _id: 's1',
      name: 'single_select',
      label: 'Single Select',
      type: 'select',
      values: [{ value: 's1', label: 'Option 1' }],
    });
  });

  it('should prepare multiselect properties and keep parent information when present', () => {
    const property = {
      _id: 'm1',
      name: 'multi_select',
      label: 'Multi Select',
      type: 'multiselect',
    } as BaseMetadataProperty;

    expect(formatSelectProperty(property, metadata)).toEqual({
      _id: 'm1',
      name: 'multi_select',
      label: 'Multi Select',
      type: 'multiselect',
      values: [
        { value: 'm1', label: 'Option A', parent: { value: 'p1', label: 'Parent A' } },
        { value: 'm2', label: 'Option B' },
      ],
    });
  });

  it('should return empty values when metadata key is missing or empty', () => {
    const emptyArrayProperty = {
      _id: 'm2',
      name: 'empty_array',
      label: 'Empty Array',
      type: 'select',
    } as BaseMetadataProperty;

    const missingProperty = {
      _id: 'm3',
      name: 'missing_select',
      label: 'Missing Select',
      type: 'multiselect',
    } as BaseMetadataProperty;

    expect(formatSelectProperty(emptyArrayProperty, metadata)).toEqual({
      _id: 'm2',
      name: 'empty_array',
      label: 'Empty Array',
      type: 'select',
      values: [],
    });

    expect(formatSelectProperty(missingProperty, metadata)).toEqual({
      _id: 'm3',
      name: 'missing_select',
      label: 'Missing Select',
      type: 'multiselect',
      values: [],
    });
  });

  it('should fallback to empty strings for missing option value and label', () => {
    const property = {
      _id: 'm4',
      name: 'empty_values',
      label: 'Empty Values',
      type: 'select',
    } as BaseMetadataProperty;

    expect(formatSelectProperty(property, metadata)).toEqual({
      _id: 'm4',
      name: 'empty_values',
      label: 'Empty Values',
      type: 'select',
      values: [
        { value: '', label: '' },
        { value: '', label: '' },
      ],
    });
  });

  it('should return null for non-select properties', () => {
    const property = {
      _id: 't1',
      name: 'simple_text',
      label: 'Simple Text',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatSelectProperty(property, metadata)).toBeNull();
  });
});
