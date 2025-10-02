import { deriveTrainingPropertyValue } from '../../informationextraction/propertyValue';

describe('deriveTrainingPropertyValue', () => {
  it('should return entity values for select-like types', () => {
    const result = deriveTrainingPropertyValue('select', {
      entityValues: [
        { value: 'A', label: 'A' },
        { value: 'B', label: 'B' },
      ],
    });
    expect(result).toEqual([
      { value: 'A', label: 'A' },
      { value: 'B', label: 'B' },
    ]);
  });

  it('should prefer currentValue for text-like properties', () => {
    const result = deriveTrainingPropertyValue('text', {
      currentValue: 'hello',
      selectionText: 'ignored',
    });
    expect(result).toBe('hello');
  });

  it('should fallback to selectionText when currentValue is absent', () => {
    const result = deriveTrainingPropertyValue('text', {
      selectionText: 'from-selection',
    });
    expect(result).toBe('from-selection');
  });

  it('should normalize epoch-like dates to YYYY-MM-DD', () => {
    const result = deriveTrainingPropertyValue('date', {
      currentValue: 1299196800, // 2011-03-04 UTC
    });
    expect(result).toBe('2011-03-04');
  });
});
