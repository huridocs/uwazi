export default function () {


  let hit = () => {
    return Object.assign({}, {
      _index: 'uwazi',
      _type: 'logs',
      _id: 'id1',
      _score: 0.05050901,
      _source: {
        doc: {}
      },
      highlight: {}
    });
  };

  let result = {
    took: 7,
    timed_out: false,
    _shards: {
      total: 5,
      successful: 5,
      failed: 0
    },
    hits: {
      total: 1,
      max_score: 0.05050901,
      hits: []
    }
  };

  return {
    toObject() {
      return result;
    },

    withDocs(docs) {
      result.hits.hits = [];
      docs.forEach((doc) => {
        let newHit = hit();
        newHit._id = doc._id;
        delete doc._id;

        newHit._source.doc = doc;
        result.hits.hits.push(newHit);
      });
      return this;
    },

    withHighlights(highlights) {
      highlights.forEach((highlight, index) => {
        if (result.hits.hits[index]) {
          result.hits.hits[index].highlight = highlight;
        }
      });
      return this;
    }
  };
}
