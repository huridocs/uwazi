import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../MetadataPropertiesType.js';
import { formatSimpleProperty } from '../Formatters/formatSimpleProperty.js';

describe('formatSimpleProperty', () => {
  const metadata = {
    simple_text: [{ value: 'Emergency incident report' }],
    numeric_field: [{ value: 42 }],
    empty_text: [{ value: '' }],
    empty_array: [],
  } as Entity['metadata'];

  it('should prepare simple properties with value, label and template id', () => {
    const textProperty = {
      _id: 'p1',
      name: 'simple_text',
      label: 'A basic simple text',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(textProperty, metadata)).toEqual({
      _id: 'p1',
      name: 'simple_text',
      type: 'text',
      values: [{ value: 'Emergency incident report' }],
      label: 'A basic simple text',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should return null for non-simple properties', () => {
    const dateProperty = {
      _id: 'p2',
      name: 'single_date',
      label: 'Single Date',
      type: 'date',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(dateProperty, metadata)).toBeNull();
  });

  it('should return an empty value when metadata key exists but has no usable value', () => {
    const emptyTextProperty = {
      _id: 'p3',
      name: 'empty_text',
      label: 'Empty Text',
      type: 'text',
    } as BaseMetadataProperty;

    const emptyArrayProperty = {
      _id: 'p5',
      name: 'empty_array',
      label: 'Empty Array',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(emptyTextProperty, metadata)).toEqual({
      _id: 'p3',
      name: 'empty_text',
      type: 'text',
      values: [{ value: '' }],
      label: 'Empty Text',
      inherited: undefined,
      inheritedType: undefined,
    });

    expect(formatSimpleProperty(emptyArrayProperty, metadata)).toEqual({
      _id: 'p5',
      name: 'empty_array',
      type: 'text',
      values: [{ value: '' }],
      label: 'Empty Array',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should return an empty value when metadata key does not exist', () => {
    const missingProperty = {
      _id: 'p6',
      name: 'missing_simple',
      label: 'Missing Simple',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(missingProperty, metadata)).toEqual({
      _id: 'p6',
      name: 'missing_simple',
      type: 'text',
      values: [{ value: '' }],
      label: 'Missing Simple',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should stringify numeric values', () => {
    const numericProperty = {
      _id: 'p4',
      name: 'numeric_field',
      label: 'Numeric',
      type: 'numeric',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(numericProperty, metadata)).toEqual({
      _id: 'p4',
      name: 'numeric_field',
      type: 'numeric',
      values: [{ value: '42' }],
      label: 'Numeric',
      inherited: undefined,
      inheritedType: undefined,
    });
  });
});
