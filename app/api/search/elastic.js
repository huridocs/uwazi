import elasticSearch from '@elastic/elasticsearch';

const elastic = new elasticSearch.Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

export default elastic;
