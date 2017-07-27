import search from 'api/search/search';
import elasticMapping from '../../../database/elastic_mapping';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from 'api/search/elastic';

export default {
  reindex() {
    return elastic.indices.delete({index: elasticIndex})
    .then(() => {
      return elastic.indices.create({
        index: elasticIndex,
        body: elasticMapping
      });
    })
    .then(() => {
      return search.indexEntities({}, '+file.fullText');
    })
    .then(() => {
      return elastic.indices.refresh({index: elasticIndex});
    });
  }
};
