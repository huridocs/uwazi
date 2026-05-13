import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatSimpleProperty } from '../formatSimpleProperty.js';

describe('formatSimpleProperty', () => {
  const metadata = {
    simple_text: [{ value: 'Emergency incident report' }],
    numeric_field: [{ value: 42 }],
    multi_text: [{ value: 'First value' }, { value: 'Second value' }, { value: '' }],
    empty_text: [{ value: '' }],
    empty_array: [],
    inherited_simple: [
      {
        value: 'entity-1',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Inherited text value' }],
      },
    ],
    inherited_nested_markdown: [
      {
        value: 'entity-1',
        inheritedType: 'relationship',
        inheritedValue: [
          {
            value: 'entity-2',
            inheritedType: 'markdown',
            inheritedValue: [{ value: '**nested markdown**' }],
          },
        ],
      },
    ],
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

  it('should keep all values when metadata contains multiple items', () => {
    const property = {
      _id: 'p7',
      name: 'multi_text',
      label: 'Multiple text values',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(property, metadata)).toEqual({
      _id: 'p7',
      name: 'multi_text',
      type: 'text',
      values: [{ value: 'First value' }, { value: 'Second value' }, { value: '' }],
      label: 'Multiple text values',
      inherited: undefined,
      inheritedType: undefined,
    });
  });

  it('should format inherited relationship values when they resolve to a simple type', () => {
    const inheritedTextProperty = {
      _id: 'p8',
      name: 'inherited_simple',
      label: 'Inherited text',
      type: 'relationship',
      inherited: true,
      inheritedType: 'text',
    } as BaseMetadataProperty;

    const nestedMarkdownProperty = {
      _id: 'p9',
      name: 'inherited_nested_markdown',
      label: 'Inherited markdown',
      type: 'relationship',
      inherited: true,
      inheritedType: 'relationship',
    } as BaseMetadataProperty;

    expect(formatSimpleProperty(inheritedTextProperty, metadata)).toEqual({
      _id: 'p8',
      name: 'inherited_simple',
      type: 'text',
      values: [{ value: 'Inherited text value' }],
      label: 'Inherited text',
      inherited: true,
      inheritedType: 'text',
    });

    expect(formatSimpleProperty(nestedMarkdownProperty, metadata)).toEqual({
      _id: 'p9',
      name: 'inherited_nested_markdown',
      type: 'markdown',
      values: [{ value: '**nested markdown**' }],
      label: 'Inherited markdown',
      inherited: true,
      inheritedType: 'relationship',
    });
  });
});
