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
});
