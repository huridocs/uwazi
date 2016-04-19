export default function () {


  let hit = () => {
    return Object.assign({}, {
      "_index": "uwazi",
      "_type": "logs",
      "_id": "id1",
      "_score": 0.05050901,
      "_source": {
        "doc": {}
      }
    });
  };

  let result = {
    "took": 7,
    "timed_out": false,
    "_shards": {
      "total": 5,
      "successful": 5,
      "failed": 0
    },
    "hits": {
      "total": 1,
      "max_score": 0.05050901,
      "hits": []
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
    }
  };
}
