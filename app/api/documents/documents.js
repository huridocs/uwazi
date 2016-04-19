import elastic from './elastic';


let buildQuery = (searchTerm) => {
  let query = {match_all: {}};
  if (searchTerm) {
    query = {
      multi_match: {
        query: searchTerm,
        type: 'phrase_prefix',
        fields: ['doc.fullText', 'doc.metadata.*', 'doc.title']
      }
    };
  }
  return {
    _source: {
      include: [ 'doc.title', 'doc.processed']
    },
    from: 0,
    size: 100,
    query: query,
    filter: {
      term: {'doc.published': true}
    }
  };
};

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
  }
};
