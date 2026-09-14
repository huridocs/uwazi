import type { MetadataValue } from '#V2/formatters/types.js';
import { copyFromValuesAreEqual, formatCopyFromValue } from '../copyFromFieldValue.js';

describe('formatCopyFromValue', () => {
  it('prefers labels and joins multiple values', () => {
    expect(
      formatCopyFromValue([
        { value: 'north', label: 'North America' },
        { value: 'south', label: 'South America' },
      ])
    ).toBe('North America, South America');
  });

  it('includes the parent label for grouped selects', () => {
    expect(
      formatCopyFromValue([
        { value: 'south', label: 'South America', parent: { label: 'Americas' } },
      ])
    ).toBe('Americas › South America');
  });

  it('falls back to primitive values and formats geolocation', () => {
    expect(formatCopyFromValue([{ value: 1973 }])).toBe('1973');
    expect(formatCopyFromValue([{ value: { lat: 4.6, lon: -74.07 } }])).toBe('4.6, -74.07');
    expect(formatCopyFromValue([])).toBe('');
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
