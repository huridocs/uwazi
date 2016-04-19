import elastic from './elastic';
import buildQuery from './elasticQuery';

export default {
  search(searchTerm) {
    return elastic.search({index: 'uwazi', body: buildQuery(searchTerm)})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        return result;
      });
    });
  },

  matchTitle(searchTerm) {
    return elastic.search({index: 'uwazi', body: buildQuery(searchTerm, ['doc.title'], ['doc.title'], 5)})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        result.title = hit.highlight['doc.title'][0];
        return result;
      });
    });
  }
};
