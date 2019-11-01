import entities from 'api/entities/entities';
import elasticConfig from 'api/config/elasticIndexes';
import elastic from 'api/search/elastic';
import elasticMapping from '../../../database/elastic_mapping';

export default (elasticIndex) => {
  elasticConfig.index = elasticIndex;
  return {
    resetIndex() {
      return elastic.indices.delete({ index: elasticIndex, ignore_unavailable: true })
      .then(() => elastic.indices.create({
          index: elasticIndex,
          body: elasticMapping
      }))
      .then(() => null);
    },
    async reindex() {
      await this.resetIndex();
      await entities.indexEntities({}, '+fullText');
      await elastic.indices.refresh({ index: elasticIndex });
    },

    refresh() {
      return elastic.indices.refresh({ index: elasticIndex });
    }
  };
};
