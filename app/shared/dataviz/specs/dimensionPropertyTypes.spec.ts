import {
  getDefaultDimensionSort,
  isDateLikePropertyType,
  isNumericPropertyType,
} from '#shared/dataviz/dimensionPropertyTypes.js';

describe('dimensionPropertyTypes', () => {
  it('should detect numeric and date-like property types', () => {
    expect(isNumericPropertyType('numeric')).toBe(true);
    expect(isNumericPropertyType('date')).toBe(false);
    expect(isDateLikePropertyType('date')).toBe(true);
    expect(isDateLikePropertyType('daterange')).toBe(true);
    expect(isDateLikePropertyType('select')).toBe(false);
  });

  it('should default sort to key order for dates and numbers', () => {
    expect(getDefaultDimensionSort('date')).toBe('key_asc');
    expect(getDefaultDimensionSort('numeric')).toBe('key_asc');
    expect(getDefaultDimensionSort('select')).toBe('count_desc');
    expect(getDefaultDimensionSort('multiselect')).toBe('count_desc');
  });
});
