import elasticSearch from 'elasticsearch'

let wtf = new elasticSearch.Client({
  host: 'localhost:9200'
});

export default wtf;
