import elasticSearch from 'elasticsearch';

let elastic = new elasticSearch.Client({
  host: process.env.ELASTICSEARCH_URL || 'localhost:9200'
});

export default elastic;
