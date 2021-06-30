/* eslint-disable max-statements */
import React from 'react';
import Immutable from 'immutable';
import { t } from 'app/I18N';
import {
  aggregationWithNestedValues,
  expectNestedResult,
  expectNestedResultWithNoZeros,
} from './fixtures/arrayUtilsFixtures';
import colorScheme from '../colorScheme';
import arrayUtils from '../arrayUtils';

const { sortValues, formatPayload, formatDataForChart } = arrayUtils;

jest.mock('app/I18N', () => ({
  __esModule: true,
  t: jest.fn(),
  default: jest.fn(),
}));

describe('Array Utils', () => {
  describe('sortValues', () => {
    it('should sort the passed values, ordering similar results by label', () => {
      const unsortedValues = [
        { label: 'b', results: 2 },
        { label: 'z', results: 3 },
        { label: 'z', results: 2 },
        { label: 'A', results: 2 },
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
        value: data[index].name,
      });

      expect(formatPayload(data)[index].formatter()).toEqual(
        <span style={{ color: '#333' }}>{data[index].name}</span>
      );
    }

    it('should map the values assigning color scheme colors', () => {
      const data = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
      testPayload(data, 0);
      testPayload(data, 3);
    });
  });

  describe('formatDataForChart', () => {
    let data;
    let property;
    let options;

    beforeEach(() => {
      t.mockImplementation((_context, label) => label);

      data = Immutable.fromJS([
        { key: 'id1', label: 'Val 1', doc_count: 10, filtered: { doc_count: 3 } },
        { key: 'id3', label: 'Val 3', doc_count: 5, filtered: { doc_count: 4 } },
        { key: 'id2', label: 'Val 2', doc_count: 20, filtered: { doc_count: 5 } },
        { key: 'missing', label: 'No value', filtered: { doc_count: 0 } },
        { key: 'any', label: 'Any', filtered: { doc_count: -672 } },
      ]);

      property = 'prop';

      options = {
        context: 'contextId',
        excludeZero: false,
        maxCategories: 0,
        scatter: false,
        aggregateOthers: 'false',
      };
    });

    const expectResults = expected => {
      const results = formatDataForChart(data, property, options);
      expect(results).toEqual(
        expected.map(item => {
          const id = Object.keys(item)[0];
          return { id, label: item[id][0], results: item[id][1] };
        })
      );
    };

    it('should aggregate filtered results for each category sorted in descending order (default)', () => {
      expectResults([{ id2: ['Val 2', 5] }, { id3: ['Val 3', 4] }, { id1: ['Val 1', 3] }]);
    });

    it('should return nested thesauri flattened if the scatter format option is true', () => {
      options.scatter = true;
      expect(formatDataForChart(aggregationWithNestedValues, property, options)).toEqual(
        expectNestedResult
      );
    });

    it('should return nested thesauri flattened, with no zero results, if the scatter and exludeZero options are true', () => {
      options.scatter = true;
      options.excludeZero = true;
      expect(formatDataForChart(aggregationWithNestedValues, property, options)).toEqual(
        expectNestedResultWithNoZeros
      );
    });

    it('should omit results without labels', () => {
      data = data.push(Immutable.fromJS({ key: 'id4', doc_count: 5, filtered: { doc_count: 1 } }));
      expectResults([{ id2: ['Val 2', 5] }, { id3: ['Val 3', 4] }, { id1: ['Val 1', 3] }]);
    });

    it('should allow plucking specific categories from the results, not failing if label not found', () => {
      options.pluckCategories = ['Val 1', 'missing', 'Val 3'];
      expectResults([{ id3: ['Val 3', 4] }, { id1: ['Val 1', 3] }]);
    });

    it('should allow sorting results in ascending order', () => {
      options.sort = { order: 'asc' };
      expectResults([{ id1: ['Val 1', 3] }, { id3: ['Val 3', 4] }, { id2: ['Val 2', 5] }]);
    });

    it('should allow sorting by labels alphabetically, ascending by default', () => {
      options.sort = { by: 'label' };
      expectResults([{ id1: ['Val 1', 3] }, { id2: ['Val 2', 5] }, { id3: ['Val 3', 4] }]);

      options.sort = { by: 'label', order: 'desc' };
      expectResults([{ id3: ['Val 3', 4] }, { id2: ['Val 2', 5] }, { id1: ['Val 1', 3] }]);
    });

    it('should allow avoiding sorting completely', () => {
      options.sort = { by: 'none' };
      expectResults([{ id1: ['Val 1', 3] }, { id3: ['Val 3', 4] }, { id2: ['Val 2', 5] }]);
    });

    it('should allow mapping the labels to other values', () => {
      options.labelsMap = { 'Val 2': 'V2', 'Val 3': 'V3' };
      expectResults([{ id2: ['V2', 5] }, { id3: ['V3', 4] }, { id1: ['Val 1', 3] }]);
    });

    it('should translate the labels of the context', () => {
      t.mockImplementation(() => 'translated Label');
      const results = formatDataForChart(data, property, options);
      expect(t).toHaveBeenCalledWith('contextId', 'Val 1', null, false);
      const translatedLabels = results.filter(res => res.label === 'translated Label');
      expect(translatedLabels.length).toBe(3);
    });
  });
});
