import React from 'react';
import colorScheme from '../colorScheme';

import { sortValues, formatPayload } from '../arrayUtils';

describe('Array Utils', () => {
  describe('sortValues', () => {
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

  describe('formatPayload', () => {
    function testPayload(data, index) {
      expect(formatPayload(data)[index]).toEqual({
        color: colorScheme[index % colorScheme.length],
        formatter: jasmine.any(Function),
        type: 'rect',
        value: data[index].name
      });

      expect(formatPayload(data)[index].formatter()).toEqual(<span style={{ color: '#333' }}>{data[index].name}</span>);
    }

    it('should map the values assigning color scheme colors', () => {
      const data = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
      testPayload(data, 0);
      testPayload(data, 3);
    });
  });
});
