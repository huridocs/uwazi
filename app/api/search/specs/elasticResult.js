export default function () {
  const hit = () => ({
    _index: 'uwazi',
    _type: 'logs',
    _id: 'id1',
    _score: 0.05050901,
    _source: {},
    highlight: {},
  });

  const result = {
    took: 7,
    timed_out: false,
    _shards: {
      total: 5,
      successful: 5,
      failed: 0,
    },
    body: {
      hits: {
        total: 10,
        max_score: 0.05050901,
        hits: [],
      },
      aggregations: {
        all: {},
      },
    },
  };

  return {
    toObject() {
      return result;
    },

    withDocs(docs) {
      result.body.hits.hits = [];
      docs.forEach(doc => {
        const newHit = hit();
        newHit._id = doc._id;
        delete doc._id;

        newHit._source = doc;
        if (doc.snippets) {
          newHit.inner_hits = { fullText: doc.snippets };
          delete doc.snippets;
        }
        result.body.hits.hits.push(newHit);
      });
      return this;
    },

    withHighlights(highlights) {
      highlights.forEach((highlight, index) => {
        if (result.body.hits.hits[index]) {
          result.body.hits.hits[index].highlight = highlight;
        }
      });
      return this;
    },
  };
}
