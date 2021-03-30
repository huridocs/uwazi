import superagent from 'superagent';

export async function refreshIndex() {
  return superagent.post('http://localhost:9200/uwazi_e2e/_refresh');
}
