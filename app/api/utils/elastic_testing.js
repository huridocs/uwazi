import entities from 'api/entities/entities';
import elasticMapping from '../../../database/elastic_mapping';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from 'api/search/elastic';

export default {
  resetIndex() {
    return elastic.indices.delete({index: elasticIndex})
    .then(() => {
      return elastic.indices.create({
        index: elasticIndex,
        body: elasticMapping
      });
    });
  },
  reindex() {
    return this.resetIndex()
    .then(() => {
      return entities.indexEntities({}, '+fullText');
    })
    .then(() => {
      return elastic.indices.refresh({index: elasticIndex});
    });
  },

  refresh() {
    return elastic.indices.refresh({index: elasticIndex});
  }
};
