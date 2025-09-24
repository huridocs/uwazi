// @ts-expect-error TS(2307): Cannot find module '../search.js' or its correspon... Remove this comment to see the full error message
import { elastic, search } from '../search.js';
import { IndicesPutMapping } from '../search/elasticTypes.js';
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
    // @ts-expect-error TS(7006): Parameter 'i' implicitly has an 'any' type.
    return (await elastic.search({ sort: [sort], size: 1000 })).body.hits.hits.map(i => i._source);
  },

  async getIndexedFullTextFromFiles() {
    const result = await elastic.search({
      body: {
        query: {
          has_parent: {
            parent_type: 'entity',
            query: {
              match_all: {},
            },
          },
        },
      },
    });

    // @ts-expect-error TS(7006): Parameter 'i' implicitly has an 'any' type.
    return result.body.hits.hits.map(i => i._source);
  },
};

export { elasticTesting };
