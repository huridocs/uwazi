import Immutable from 'immutable';

import api from 'app/Search/SearchAPI';

import markdownDatasets from '../markdownDatasets';

describe('markdownDatasets', () => {
  describe('request', () => {
    beforeEach(() => {
      spyOn(api, 'search').and.callFake(params => Promise.resolve(params));
    });

    it('should not fetch anything if no datasets defined', async () => {
      const markdown = 'no datasets defined';

      const datasets = await markdownDatasets.fetch(markdown);

      expect(api.search).not.toHaveBeenCalled();
      expect(datasets).toEqual({});
    });

    it('should fetch default dataset and return it indexed by "default" key', async () => {
      const markdown = '<div><Dataset /></div>';

      const datasets = await markdownDatasets.fetch(markdown);

      expect(datasets).toEqual({ default: { allAggregations: true, limit: 0 } });
    });

    it('should fetch named datasets and return it indexed by name attrib key', async () => {
      const markdown = `
      <div>
        <Dataset />
        <Dataset url="url?q=(key:value,limit:50)" name="dataset2"/>
      </div>
      <Dataset name="dataset1" url="url2?q=(key:value2)"/>
      `;

      const datasets = await markdownDatasets.fetch(markdown);

      expect(datasets).toEqual({
        default: { allAggregations: true, limit: 0 },
        dataset1: { key: 'value2', limit: 0 },
        dataset2: { key: 'value', limit: 0 },
      });
    });
  });

  describe('getAggregation', () => {
    const dataset = {
      aggregations: {
        all: {
          types: {
            buckets: [{ key: 'id1', filtered: { doc_count: 1 } }, { key: 'id2', filtered: { doc_count: 25 } }]
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
          types: {
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
      let aggregation = markdownDatasets.getAggregation(state, { property: 'types', value: 'id2' });
      expect(aggregation).toBe(25);

      aggregation = markdownDatasets.getAggregation(state, { property: 'property1', value: 'id3' });
      expect(aggregation).toBe(5);

      aggregation = markdownDatasets.getAggregation(state, { property: 'types', value: 'id5', dataset: 'another_dataset' });
      expect(aggregation).toBe(6);
    });

    it('should return null when dataset do not exists', () => {
      const aggregation = markdownDatasets.getAggregation(state, { dataset: 'non_existent_dataset' });
      expect(aggregation).toBeUndefined();
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
});
