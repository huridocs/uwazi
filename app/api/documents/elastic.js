import elasticSearch from 'elasticsearch'

let elastic = new elasticSearch.Client({
  host: 'localhost:9200'
});

export default elastic;
