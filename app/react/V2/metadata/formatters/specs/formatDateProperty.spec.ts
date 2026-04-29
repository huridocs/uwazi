import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatDateProperty } from '../formatDateProperty.js';

describe('formatDateProperty', () => {
  const metadata = {
    single_date: [{ value: 1717027200 }],
    multi_date: [{ value: 1717027200 }, { value: 1717113600000 }],
    date_range: [{ value: { from: 1717027200, to: 1717113600 } }],
    empty_date: [],
  } as Entity['metadata'];

  it('should prepare single date properties', () => {
    const property = {
      _id: 'd1',
      name: 'single_date',
      label: 'Single Date',
      type: 'date',
    } as BaseMetadataProperty;

    expect(formatDateProperty(property, metadata)).toEqual({
      _id: 'd1',
      name: 'single_date',
      label: 'Single Date',
      type: 'date',
      values: [{ value: 1717027200 }],
    });
  });

  it('should prepare multi date properties', () => {
    const property = {
      _id: 'd2',
      name: 'multi_date',
      label: 'Multi Date',
      type: 'multidate',
    } as BaseMetadataProperty;

    expect(formatDateProperty(property, metadata)).toEqual({
      _id: 'd2',
      name: 'multi_date',
      label: 'Multi Date',
      type: 'multidate',
      values: [{ value: 1717027200 }, { value: 1717113600000 }],
    });
  });

  it('should prepare date range properties', () => {
    const property = {
      _id: 'd3',
      name: 'date_range',
      label: 'Date Range',
      type: 'daterange',
    } as BaseMetadataProperty;

    expect(formatDateProperty(property, metadata)).toEqual({
      _id: 'd3',
      name: 'date_range',
      label: 'Date Range',
      type: 'daterange',
      values: [{ value: { from: 1717027200, to: 1717113600 } }],
    });
  });

  it('should return empty values for missing or empty date metadata', () => {
    const emptyProperty = {
      _id: 'd4',
      name: 'empty_date',
      label: 'Empty Date',
      type: 'date',
    } as BaseMetadataProperty;

    const missingProperty = {
      _id: 'd5',
      name: 'missing_date',
      label: 'Missing Date',
      type: 'date',
    } as BaseMetadataProperty;

    expect(formatDateProperty(emptyProperty, metadata)).toEqual({
      _id: 'd4',
      name: 'empty_date',
      label: 'Empty Date',
      type: 'date',
      values: [],
    });

    expect(formatDateProperty(missingProperty, metadata)).toEqual({
      _id: 'd5',
      name: 'missing_date',
      label: 'Missing Date',
      type: 'date',
      values: [],
    });
  });

  it('should return null for non-date properties', () => {
    const property = {
      _id: 'd6',
      name: 'simple_text',
      label: 'Simple Text',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatDateProperty(property, metadata)).toBeNull();
  });
});
