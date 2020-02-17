import sortThesauri from '../sortThesauri';

describe('Sort Thesauri List', () => {
  describe('sortThesauriList', () => {
    it('should sort the thesauri by name', () => {
      const unsortedValues = [{ name: 'Ba' }, { name: 'ab' }, { name: 'za' }, { name: 'Xi' }];

      expect(sortThesauri(unsortedValues)[0]).toEqual({ name: 'ab' });
      expect(sortThesauri(unsortedValues)[1]).toEqual({ name: 'Ba' });
      expect(sortThesauri(unsortedValues)[2]).toEqual({ name: 'Xi' });
      expect(sortThesauri(unsortedValues)[3]).toEqual({ name: 'za' });
    });
  });
});
