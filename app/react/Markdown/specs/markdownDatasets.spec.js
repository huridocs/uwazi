import Immutable from 'immutable';

import searchApi from 'app/Search/SearchAPI';
import entitiesApi from 'app/Entities/EntitiesAPI';

import markdownDatasets from '../markdownDatasets';

describe('markdownDatasets', () => {
  describe('request', () => {
    beforeEach(() => {
      spyOn(searchApi, 'search').and.callFake(params => Promise.resolve(Object.assign({ isSearch: true }, params)));
      spyOn(entitiesApi, 'get').and.callFake(_id => Promise.resolve([{ isEntity: true, _id }]));
    });

    it('should not fetch anything if no datasets defined', async () => {
      const markdown = 'no datasets defined';

      const datasets = await markdownDatasets.fetch(markdown);

      expect(searchApi.search).not.toHaveBeenCalled();
      expect(datasets).toEqual({});
    });

    it('should fetch default dataset and return it indexed by "default" key', async () => {
      const markdown = '<div><Dataset /></div>';

      const datasets = await markdownDatasets.fetch(markdown);

      expect(datasets).toEqual({ default: { allAggregations: true, limit: 0, isSearch: true } });
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

      const datasets = await markdownDatasets.fetch(markdown);

      expect(datasets).toEqual({
        default: { allAggregations: true, limit: 0, isSearch: true },
        dataset1: { key: 'value2', limit: 0, isSearch: true },
        dataset2: { key: 'value', limit: 0, isSearch: true },
        entityDataset: { _id: 'entityId', isEntity: true },
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

      const datasets = await markdownDatasets.fetch(markdown);

      expect(datasets).toEqual({
        default: { allAggregations: true, limit: 0, isSearch: true },
        dataset1: { key: 'value2', limit: 0, isSearch: true },
        dataset2: { key: 'value', limit: 0, geolocation: true, isSearch: true },
        dataset3: { allAggregations: true, limit: 0, geolocation: true, isSearch: true },
      });
    });
  });

  describe('getRows', () => {
    const dataset1 = { rows: 'rows dataset 1' };
    const dataset2 = { rows: 'rows dataset 2' };

    const state = {
      page: {
        datasets: Immutable.fromJS({ default: dataset1, another_dataset: dataset2 })
      }
    };

    it('should get the rows for the default dataset', () => {
      let rows = markdownDatasets.getRows(state, { });
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
    const dataset = {
      aggregations: {
        all: {
          property1: {
            buckets: [{ key: 'id3', filtered: { doc_count: 5 } }, { key: 'id4', filtered: { doc_count: 7 } }]
          },
          property2: {
            buckets: [{ key: 'id5', filtered: { doc_count: 5 } }, { key: 'id6', filtered: { doc_count: 7 } }]
          }
        }
      }
    };

    const dataset2 = {
      aggregations: {
        all: {
          property3: {
            buckets: [{ key: 'id7', filtered: { doc_count: 6 } }, { key: 'id8', filtered: { doc_count: 76 } }]
          },
          property4: {
            buckets: [{ key: 'id36', filtered: { doc_count: 36 } }]
          }
        }
      }
    };

    const state = {
      page: {
        datasets: Immutable.fromJS({
          default: dataset,
          another_dataset: dataset2
        })
      }
    };

    it('should get the aggregation for the type/property and value', () => {
      let aggregations = markdownDatasets.getAggregations(state, { property: 'property1' });
      expect(aggregations).toEqual(Immutable.fromJS([
        { key: 'id3', filtered: { doc_count: 5 } }, { key: 'id4', filtered: { doc_count: 7 } }
      ]));

      aggregations = markdownDatasets.getAggregations(state, { property: 'property2' });
      expect(aggregations).toEqual(Immutable.fromJS([
        { key: 'id5', filtered: { doc_count: 5 } }, { key: 'id6', filtered: { doc_count: 7 } }
      ]));

      aggregations = markdownDatasets.getAggregations(state, { property: 'property4', dataset: 'another_dataset' });
      expect(aggregations).toEqual(Immutable.fromJS([
        { key: 'id36', filtered: { doc_count: 36 } }
      ]));
    });

    it('should return null when dataset do not exists', () => {
      const aggregations = markdownDatasets.getAggregations(state, { dataset: 'non_existent_dataset' });
      expect(aggregations).toBeUndefined();
    });
  });

  describe('getAggregation', () => {
    const dataset = {
      aggregations: {
        all: {
          _types: {
            buckets: [
              { key: 'id1', filtered: { doc_count: 1 } },
              { key: 'id2', filtered: { doc_count: 25 } },
              { key: 'id3', filtered: { doc_count: 5.6 } },
              { key: 'id4', filtered: { doc_count: 7.8 } },
            ]
          },
          property1: {
            buckets: [{ key: 'id3', filtered: { doc_count: 5 } }]
          }
        }
      }
    };

    const dataset2 = {
      aggregations: {
        all: {
          _types: {
            buckets: [{ key: 'id5', filtered: { doc_count: 6 } }, { key: 'id7', filtered: { doc_count: 76 } }]
          },
          property4: {
            buckets: [{ key: 'id36', filtered: { doc_count: 36 } }]
          }
        }
      }
    };

    const state = {
      page: {
        datasets: Immutable.fromJS({
          default: dataset,
          another_dataset: dataset2
        })
      }
    };

    it('should get the aggregation for the type/property and value', () => {
      let aggregation = markdownDatasets.getAggregation(state, { property: '_types', value: 'id2' });
      expect(aggregation).toBe(25);

      aggregation = markdownDatasets.getAggregation(state, { property: 'property1', value: 'id3' });
      expect(aggregation).toBe(5);

      aggregation = markdownDatasets.getAggregation(state, { dataset: 'another_dataset', property: '_types', value: 'id5' });
      expect(aggregation).toBe(6);
    });

    it('should get multiple values, adding them together if value is a list, omitting undefined', () => {
      let aggregation = markdownDatasets.getAggregation(state, { property: '_types', value: 'id1,id2' });
      expect(aggregation).toBe(26);

      aggregation = markdownDatasets.getAggregation(state, { property: '_types', value: 'id4,id3' });
      expect(aggregation).toBe(13.4);

      // aggregation = markdownDatasets.getAggregation(state, { dataset: 'another_dataset', property: '_types', value: 'id5,id7,id8' });
      // expect(aggregation).toBe(82);
    });

    it('should return null when dataset do not exists', () => {
      const aggregation = markdownDatasets.getAggregation(state, { dataset: 'non_existent_dataset' });
      expect(aggregation).toBeUndefined();
    });
  });

  describe('getMetadataValue', () => {
    const dataset1 = {
      title: 'Entity 1',
      metadata: { progress: '3.5', otherProperty: '2' },
    };

    const dataset2 = {
      title: 'Entity 2',
      metadata: { progress: '1.5', otherProperty: '4' },
    };

    const state = {
      page: {
        datasets: Immutable.fromJS({ default: dataset1, another_dataset: dataset2 })
      }
    };

    it('should get the value for the property', () => {
      expect(markdownDatasets.getMetadataValue(state, { property: 'progress' })).toBe(3.5);
      expect(markdownDatasets.getMetadataValue(state, { property: 'otherProperty', dataset: 'another_dataset' })).toBe(4);
    });

    it('should return undefined when dataset does not exist', () => {
      expect(markdownDatasets.getMetadataValue(state, { dataset: 'non_existent_dataset' })).toBeUndefined();
    });
  });
});
