import { elastic, search } from 'api/search';
import { IndicesPutMapping } from 'api/search/elasticTypes';
import elasticMapping from '../../../database/elastic_mapping/elastic_mapping';

const elasticTesting = {
  async resetIndex() {
    await elastic.indices.delete({ ignore_unavailable: true });
    await elastic.indices.create({ body: elasticMapping });
    await search.updateTemplatesMapping();
    return this.refresh();
  },

  async reindex() {
    await this.resetIndex();
    await search.indexEntities({}, '+fullText');
    await this.refresh();
  },

  async putMapping(body: IndicesPutMapping) {
    await elastic.indices.putMapping({ body });
  },

  async refresh() {
    await elastic.indices.refresh();
  },

  async getIndexedEntities(sort = 'title.sort') {
    return (await elastic.search({ sort: [sort] })).body.hits.hits.map(i => i._source);
  },
};

export { elasticTesting };
