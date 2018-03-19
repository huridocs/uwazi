import entities from 'api/entities/entities';
import elasticMapping from '../../../database/elastic_mapping';
import elasticConfig from 'api/config/elasticIndexes';
import elastic from 'api/search/elastic';

export default (elasticIndex) => {
  elasticConfig.index = elasticIndex;
  return {
    resetIndex() {
      return elastic.indices.delete({index: elasticIndex, ignore_unavailable: true})
      .then(() => {
        return elastic.indices.create({
          index: elasticIndex,
          body: elasticMapping
        });
      })
      .then(() => null);
    },
    reindex() {
      return this.resetIndex()
      .then(() => {
        return entities.indexEntities({}, '+fullText');
      })
      .then(() => {
        return elastic.indices.refresh({index: elasticIndex});
      })
      .then(() => null);
    },

    refresh() {
      return elastic.indices.refresh({index: elasticIndex});
    }
  };
};
