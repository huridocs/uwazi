import React from 'react';
import Immutable from 'immutable';
import * as libraryFilters from 'app/Library/helpers/libraryFilters';
import colorScheme from '../colorScheme';
import arrayUtils from '../arrayUtils';

const { sortValues, formatPayload, formatDataForChart } = arrayUtils;

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
    let thesauri;
    let options;

    beforeEach(() => {
      data = Immutable.fromJS([
        { key: 'id1', doc_count: 10, filtered: { doc_count: 3 } },
        { key: 'id2', doc_count: 20, filtered: { doc_count: 5 } },
        { key: 'id3', doc_count: 5, filtered: { doc_count: 4 } },
      ]);
      property = 'prop';
      thesauri = Immutable.fromJS([
        {
          name: 'Thes',
          values: [
            { label: 'Val 1', id: 'id1' },
            { label: 'Val 2', id: 'id2' },
            { label: 'Val 3', id: 'id3' },
          ],
        },
      ]);
      options = {
        context: 'contextId',
        excludeZero: false,
        maxCategories: 0,
        aggregateOthers: 'false',
      };
      jest.spyOn(libraryFilters, 'populateOptions').mockReturnValue([
        {
          content: 'contextId',
          options: [
            { label: 'Val 1', id: 'id1' },
            { label: 'Val 2', id: 'id2' },
            { label: 'Val 3', id: 'id3' },
          ],
        },
      ]);
    });

    it('should aggregate filtered results for each category sorted in descending order', () => {
      const results = formatDataForChart(data, property, thesauri, options);
      expect(results).toEqual([
        { label: 'Val 2', id: 'id2', results: 5 },
        { label: 'Val 3', id: 'id3', results: 4 },
        { label: 'Val 1', id: 'id1', results: 3 },
      ]);
      expect(libraryFilters.populateOptions).toHaveBeenCalledWith(
        [{ content: options.context }],
        thesauri.toJS()
      );
    });

    it('should omit results without labels', () => {
      data = data.push(Immutable.fromJS({ key: 'id4', doc_count: 5, filtered: { doc_count: 1 } }));
      const results = formatDataForChart(data, property, thesauri, options);
      expect(results).toEqual([
        { label: 'Val 2', id: 'id2', results: 5 },
        { label: 'Val 3', id: 'id3', results: 4 },
        { label: 'Val 1', id: 'id1', results: 3 },
      ]);
    });

    it('should return an empty array if no labels are found for the given context', () => {
      jest
        .spyOn(libraryFilters, 'populateOptions')
        .mockReturnValue([{ content: 'contextId', options: null }]);
      const results = formatDataForChart(data, property, thesauri, options);
      expect(results).toEqual([]);
    });
  });
});
