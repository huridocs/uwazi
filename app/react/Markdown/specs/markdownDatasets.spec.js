/* eslint-disable max-lines */
import Immutable from 'immutable';

import { RequestParams } from 'app/utils/RequestParams';
import searchApi from 'app/Search/SearchAPI';
import entitiesApi from 'app/Entities/EntitiesAPI';
import api from 'app/utils/api';

import markdownDatasets from '../markdownDatasets';
import fixtures from './fixtures';

describe('markdownDatasets', () => {
  let requestParams;

  const getTestState = method => {
    const { dataset1, dataset2 } = fixtures[method];

    return {
      page: {
        datasets: Immutable.fromJS({ default: dataset1, another_dataset: dataset2 }),
      },
    };
  };

  describe('fetch', () => {
    const basicQueryMarkdown = `
    <div>
      <Query url="users?_id=23234324" name="customQuery"/>
    </div>
    `;

    beforeEach(() => {
      requestParams = new RequestParams({}, 'headers');
      spyOn(searchApi, 'search').and.callFake(params =>
        Promise.resolve({ isSearch: true, headers: params.headers, ...params.data })
      );
      spyOn(entitiesApi, 'get').and.callFake(params =>
        Promise.resolve([{ isEntity: true, data: params.data, headers: params.headers }])
      );
      spyOn(api, 'get').and.callFake((url, pasedRequestParams) => {
        if (url === 'multirowEndpoint') {
          return Promise.resolve({ json: { rows: ['row1', 'row2'] } });
        }
        return Promise.resolve({ json: { url, headers: pasedRequestParams.headers } });
      });
    });

    it('should not fetch anything if no datasets defined', async () => {
      const markdown = 'no datasets defined';

      const datasets = await markdownDatasets.fetch(markdown);

      expect(searchApi.search).not.toHaveBeenCalled();
      expect(datasets).toEqual({});
    });

    it('should fetch default dataset and return it indexed by "default" key', async () => {
      const markdown = '<div><Dataset /></div>';

      const datasets = await markdownDatasets.fetch(markdown, requestParams);

      expect(datasets).toEqual({
        default: { allAggregations: true, limit: 0, isSearch: true, headers: 'headers' },
      });
    });

    it('should fetch named datasets and return it indexed by name attrib key', async () => {
      const markdown = `
      <div>
        <Dataset />
        <Dataset url="url?q=(key:value,limit:50)" name="dataset2"/>
        <Dataset entity="entityId" name="entityDataset"/>
      </div>
      <Dataset name="dataset1" url="url2?q=(key:value2)"/>
      `;

      const datasets = await markdownDatasets.fetch(markdown, requestParams);

      expect(datasets).toEqual({
        default: { allAggregations: true, limit: 0, isSearch: true, headers: 'headers' },
        dataset1: { key: 'value2', limit: 0, isSearch: true, headers: 'headers' },
        dataset2: { key: 'value', limit: 0, isSearch: true, headers: 'headers' },
        entityDataset: { data: { sharedId: 'entityId' }, isEntity: true, headers: 'headers' },
      });
    });

    it('should allow fetching geolocation data', async () => {
      const markdown = `
      <div>
        <Dataset />
        <Dataset url="url?q=(key:value,limit:50)" name="dataset2" geolocation="true" />
      </div>
      <Dataset name="dataset1" url="url2?q=(key:value2)"/>
      <Dataset name="dataset3" geolocation="true"/>
      `;

      const datasets = await markdownDatasets.fetch(markdown, requestParams);

      expect(datasets).toEqual({
        default: { allAggregations: true, limit: 0, isSearch: true, headers: 'headers' },
        dataset1: { key: 'value2', limit: 0, isSearch: true, headers: 'headers' },
        dataset2: { key: 'value', limit: 0, geolocation: true, isSearch: true, headers: 'headers' },
        dataset3: {
          allAggregations: true,
          limit: 0,
          geolocation: true,
          isSearch: true,
          headers: 'headers',
        },
      });
    });

    it('should allow query to any api endpoint', async () => {
      const markdown = basicQueryMarkdown;
      const datasets = await markdownDatasets.fetch(markdown, requestParams);
      expect(datasets).toEqual({
        customQuery: { url: 'users?_id=23234324', headers: 'headers' },
      });
    });

    describe('added datasets', () => {
      it('should allow passing arbitrary additional datasets, overriding markdown values', async () => {
        const markdown = `${basicQueryMarkdown}
        <Query url="toBeOverriden" name="customDataset" />
        `;

        const additionalDatasets = {
          customDataset: { url: 'apiEndpoint?params=true', query: true },
        };

        const datasets = await markdownDatasets.fetch(markdown, requestParams, {
          additionalDatasets,
        });

        expect(datasets).toEqual({
          customDataset: { url: 'apiEndpoint?params=true', headers: 'headers' },
          customQuery: { url: 'users?_id=23234324', headers: 'headers' },
        });
      });

      it('should allow passing params to extract first row of response', async () => {
        const additionalDatasets = {
          multipleRows: { url: 'multirowEndpoint', query: true },
          singleRow: { url: 'multirowEndpoint', query: true, extractFirstRow: true },
        };

        const datasets = await markdownDatasets.fetch('', requestParams, { additionalDatasets });

        expect(datasets).toEqual({
          multipleRows: { rows: ['row1', 'row2'] },
          singleRow: 'row1',
        });
      });
    });
  });

  describe('getRows', () => {
    const state = getTestState('getRows');

    it('should get the rows for the default dataset', () => {
      let rows = markdownDatasets.getRows(state, {});
      expect(rows).toBe('rows dataset 1');

      rows = markdownDatasets.getRows(state, { dataset: 'another_dataset' });
      expect(rows).toBe('rows dataset 2');
    });

    it('should return null when dataset do not exists', () => {
      const rows = markdownDatasets.getRows(state, { dataset: 'non_existent_dataset' });
      expect(rows).toBeUndefined();
    });
  });

  describe('getAggregations', () => {
    const state = getTestState('getAggregations');

    it('should get the aggregation for the type/property and value', () => {
      let aggregations = markdownDatasets.getAggregations(state, { property: 'property1' });
      expect(aggregations).toEqual(
        Immutable.fromJS([
          { key: 'id3', filtered: { doc_count: 5 } },
          { key: 'id4', filtered: { doc_count: 7 } },
        ])
      );

      aggregations = markdownDatasets.getAggregations(state, { property: 'property2' });
      expect(aggregations).toEqual(
        Immutable.fromJS([
          { key: 'id5', filtered: { doc_count: 5 } },
          { key: 'id6', filtered: { doc_count: 7 } },
        ])
      );

      aggregations = markdownDatasets.getAggregations(state, {
        property: 'property4',
        dataset: 'another_dataset',
      });
      expect(aggregations).toEqual(
        Immutable.fromJS([{ key: 'id36', filtered: { doc_count: 36 } }])
      );
    });

    it('should return null when dataset do not exists', () => {
      const aggregations = markdownDatasets.getAggregations(state, {
        dataset: 'non_existent_dataset',
      });
      expect(aggregations).toBeUndefined();
    });
  });

  describe('getAggregation', () => {
    const state = getTestState('getAggregation');

    const expectAggregation = options => expect(markdownDatasets.getAggregation(state, options));

    describe('when uniqueValues', () => {
      it('should return a count of all buckets of the property filtering zeros out', () => {
        expectAggregation({ property: '_types', uniqueValues: 'true' }).toBe(4);
      });

      it('should return null when dataset do not exists', () => {
        const aggregation = markdownDatasets.getAggregation(state, {
          uniqueValues: 'true',
          dataset: 'non_existent_dataset',
        });
        expect(aggregation).toBeUndefined();
      });
    });

    it('should get the aggregation for the type/property and value', () => {
      expectAggregation({ property: '_types', value: 'id2' }).toBe(25);
      expectAggregation({ property: 'property1', value: 'id3' }).toBe(5);
      expectAggregation({ dataset: 'another_dataset', property: '_types', value: 'id5' }).toBe(6);
    });

    it('should get multiple values, adding them together if value is a list, omitting undefined', () => {
      expectAggregation({ property: '_types', value: 'id1,id2' }).toBe(26);
      expectAggregation({ property: '_types', value: 'id4,id3' }).toBe(13.4);
      expectAggregation({
        dataset: 'another_dataset',
        property: '_types',
        value: 'id5,id7,id8',
      }).toBe(82);
    });

    it('should return null when dataset do not exists', () => {
      const aggregation = markdownDatasets.getAggregation(state, {
        dataset: 'non_existent_dataset',
      });
      expect(aggregation).toBeUndefined();
    });
  });

  describe('getMetadataValue', () => {
    const state = getTestState('getMetadataValue');

    it('should get the value for the property', () => {
      expect(markdownDatasets.getMetadataValue(state, { property: 'progress' })).toBe(3.5);
      expect(
        markdownDatasets.getMetadataValue(state, {
          property: 'otherProperty',
          dataset: 'another_dataset',
        })
      ).toBe(4);
    });

    it('should return undefined when dataset does not exist', () => {
      expect(
        markdownDatasets.getMetadataValue(state, { dataset: 'non_existent_dataset' })
      ).toBeUndefined();
    });

    it('should not throw a TypeError if the property does not exist', () => {
      expect(() => {
        markdownDatasets.getMetadataValue(state, { property: 'non_existing_property' });
      }).not.toThrow();
    });
  });
});
