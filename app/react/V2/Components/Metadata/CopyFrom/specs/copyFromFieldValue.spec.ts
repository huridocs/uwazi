import type { MetadataValue } from '#V2/formatters/types.js';
import {
  formatMetadataTimestamp,
  metadataDisplayPresets,
} from '#V2/Components/Metadata/display/index.js';
import { copyFromValuesAreEqual, formatCopyFromValue } from '../copyFromFieldValue.js';
import type { CopyFromMatchingProperty } from '../copyFromMatchingProperties.js';

const context = { ...metadataDisplayPresets.compact, locale: 'en' };

const property = (
  type: CopyFromMatchingProperty['type'],
  name: string,
  label: string
): CopyFromMatchingProperty => ({
  name,
  type,
  label,
});

describe('formatCopyFromValue', () => {
  it('prefers labels and joins multiple values', () => {
    expect(
      formatCopyFromValue(
        [
          { value: 'north', label: 'North America' },
          { value: 'south', label: 'South America' },
        ],
        property('select', 'region', 'Region'),
        context
      )
    ).toBe('North America, South America');
  });

  it('includes the parent label for grouped selects', () => {
    expect(
      formatCopyFromValue(
        [{ value: 'south', label: 'South America', parent: { label: 'Americas' } }],
        property('select', 'region', 'Region'),
        context
      )
    ).toBe('Americas › South America');
  });

  it('formats numeric values and geolocation coordinates', () => {
    expect(
      formatCopyFromValue([{ value: 1973 }], property('numeric', 'year', 'Year'), context)
    ).toBe('1973');
    expect(
      formatCopyFromValue(
        [{ value: { lat: 4.6, lon: -74.07 } }],
        property('geolocation', 'location', 'Location'),
        context
      )
    ).toBe('4.6, -74.07');
    expect(
      formatCopyFromValue(
        [{ value: { latitude: 4.6, longitude: -74.07 } }],
        property('geolocation', 'location', 'Location'),
        context
      )
    ).toBe('4.6, -74.07');
    expect(formatCopyFromValue([], property('text', 'title', 'Title'), context)).toBe('');
  });

  it('formats date timestamps with the metadata display formatter', () => {
    expect(
      formatCopyFromValue([{ value: 1251072000 }], property('date', 'fecha', 'Fecha'), context)
    ).toBe(formatMetadataTimestamp(1251072000, context));
    expect(
      formatCopyFromValue(
        [{ value: { from: 1251072000, to: 1456444800 } }],
        property('daterange', 'rango', 'Rango'),
        context
      )
    ).toBe(
      `${formatMetadataTimestamp(1251072000, context)} ~ ${formatMetadataTimestamp(1456444800, context)}`
    );
  });
});

describe('copyFromValuesAreEqual', () => {
  const yes: MetadataValue[] = [{ value: 'yes', label: 'Yes' }];

  it('treats the same value as equal even when labels match', () => {
    expect(copyFromValuesAreEqual(yes, [{ value: 'yes', label: 'Yes' }])).toBe(true);
    expect(copyFromValuesAreEqual(yes, [{ value: 'no', label: 'No' }])).toBe(false);
    expect(copyFromValuesAreEqual(undefined, [])).toBe(true);
  });
});
