import { elastic } from 'api/search';
import elasticMapping from '../../../database/elastic_mapping';

export default (elasticIndex, search) => ({
  resetIndex() {
    return elastic.indices.delete({ index: elasticIndex, ignore_unavailable: true }).then(() =>
      elastic.indices.create({
        index: elasticIndex,
        body: elasticMapping,
      })
    );
  },
  reindex() {
    return this.resetIndex()
      .then(() => search.indexEntities({}, '+fullText'))
      .then(() => this.refresh());
  },

  async refresh() {
    await elastic.indices.refresh({ index: elasticIndex });
  },
});
