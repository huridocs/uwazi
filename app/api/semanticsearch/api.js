import fetch from 'isomorphic-fetch';


const SEMANTIC_SEARCH_URL = 'http://localhost:5000';

const semanticSearchAPI = {
  async processDocument(args) {
    const res = await fetch(`${SEMANTIC_SEARCH_URL}/process-document`, {
      method: 'POST',
      body: JSON.stringify(args),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const body = await res.json();
    return body;
  }
};

export default semanticSearchAPI;

