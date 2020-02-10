import elasticSearch from 'elasticsearch';

const elastic = new elasticSearch.Client({
  host: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

export default elastic;
