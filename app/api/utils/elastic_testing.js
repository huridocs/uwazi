import entities from 'api/entities/entities';
import relationships from 'api/relationships/relationships';
import elasticMapping from '../../../database/elastic_mapping';
import elasticConfig from 'api/config/elasticIndexes';
import elastic from 'api/search/elastic';

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
      .then(() => relationships.indexRelationships({}))
      .then(() => elastic.indices.refresh({ index: elasticIndex }))
      .then(() => null);
    },

    refresh() {
      return elastic.indices.refresh({ index: elasticIndex });
    }
  };
};
