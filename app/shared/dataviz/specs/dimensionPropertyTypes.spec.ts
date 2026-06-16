import { isDateLikePropertyType, isNumericPropertyType } from '#shared/dataviz/dimensionPropertyTypes.js';

describe('dimensionPropertyTypes', () => {
  it('should detect numeric and date-like property types', () => {
    expect(isNumericPropertyType('numeric')).toBe(true);
    expect(isNumericPropertyType('date')).toBe(false);
    expect(isDateLikePropertyType('date')).toBe(true);
    expect(isDateLikePropertyType('daterange')).toBe(true);
    expect(isDateLikePropertyType('select')).toBe(false);
  });
});
