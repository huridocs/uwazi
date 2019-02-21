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
    reindex() {
      return this.resetIndex()
      .then(() => entities.indexEntities({}, '+fullText'))
      .then(() => elastic.indices.refresh({ index: elasticIndex }))
      .then(() => null);
    },

    refresh() {
      return elastic.indices.refresh({ index: elasticIndex });
    }
  };
};
