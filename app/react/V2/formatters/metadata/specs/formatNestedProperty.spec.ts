import { Entity } from '#V2/api/entities/types.js';
import { BaseMetadataProperty } from '../../types.js';
import { formatNestedProperty } from '../formatNestedProperty.js';

describe('formatNestedProperty', () => {
  it('should return null for non-nested properties', () => {
    const property = {
      _id: '1',
      name: 'simple',
      label: 'Simple',
      type: 'text',
    } as BaseMetadataProperty;

    expect(formatNestedProperty(property, {})).toBeNull();
  });

  it('should return null when metadata is missing or empty', () => {
    const property = {
      _id: '1',
      name: 'nested_field',
      label: 'Nested',
      type: 'nested',
    } as BaseMetadataProperty;

    expect(formatNestedProperty(property, undefined)).toBeNull();
    expect(formatNestedProperty(property, { nested_field: [] } as Entity['metadata'])).toBeNull();
  });

  it('should build a markdown table from nested rows (legacy nested → markdown)', () => {
    const property = {
      _id: 'n1',
      name: 'violations_table',
      label: 'Violations',
      type: 'nested',
    } as BaseMetadataProperty;

    const metadata = {
      violations_table: [
        {
          value: {
            daddh: ['Art. 1'],
            dple: ['Art. 2'],
          },
        },
        {
          value: {
            daddh: ['Art. 3'],
            dple: ['Art. 4'],
          },
        },
      ],
    } as unknown as Entity['metadata'];

    const result = formatNestedProperty(property, metadata, 'en');

    expect(result?.type).toBe('markdown');
    expect(result?.values[0]?.value).toContain('|');
    expect(result?.values[0]?.value).toContain('ADRDM');
    expect(result?.values[0]?.value).toContain('DPFE');
    expect(result?.values[0]?.value).toContain('Art. 1');
    expect(result?.values[0]?.value).toContain('Art. 4');
  });
});
