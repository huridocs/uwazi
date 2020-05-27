import { filterOptions } from '../optionsUtils';

describe('Options utils', () => {
  describe('filterOptions', () => {
    let options;
    beforeEach(() => {
      options = [
        { label: 'Apple' },
        { label: 'Orange' },
        {
          label: 'Group',
          options: [{ label: 'Pineapple' }, { label: 'Lemon' }],
        },
        { label: 'Range Rover' },
      ];
    });

    it('should return only items matching the filter', () => {
      const filtered = filterOptions('range', options, 'label');
      expect(filtered).toEqual([{ label: 'Orange' }, { label: 'Range Rover' }]);
    });

    it('should include group if its children match the filter', () => {
      const filtered = filterOptions('apple', options, 'label');
      expect(filtered).toEqual([
        { label: 'Apple' },
        {
          label: 'Group',
          options: [{ label: 'Pineapple' }, { label: 'Lemon' }],
        },
      ]);
    });
  });
});
