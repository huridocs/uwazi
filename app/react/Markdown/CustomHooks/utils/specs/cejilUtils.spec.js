import { sortValues } from '../cejilUtils';

describe('CEJIL Utils', () => {
  describe('sortCountries', () => {
    it('should sort the passed values, ordering similar results by label', () => {
      const unsortedValues = [
        { label: 'b', results: 2 },
        { label: 'z', results: 3 },
        { label: 'z', results: 2 },
        { label: 'A', results: 2 }
      ];

      expect(sortValues(unsortedValues)[0]).toEqual({ label: 'z', results: 3 });
      expect(sortValues(unsortedValues)[1]).toEqual({ label: 'A', results: 2 });
      expect(sortValues(unsortedValues)[2]).toEqual({ label: 'b', results: 2 });
      expect(sortValues(unsortedValues)[3]).toEqual({ label: 'z', results: 2 });
    });
  });
});
