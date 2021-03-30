import superagent from 'superagent';

export async function refreshIndex() {
  const elasticSearchServer = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
  const index = process.env.INDEX_NAME || 'uwazi_e2e';

  return superagent.post(`${elasticSearchServer}/${index}/_refresh`);
}
