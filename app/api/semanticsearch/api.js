import fetch from 'isomorphic-fetch';
import SEMANTIC_SEARCH_URL from 'api/config/semanticsearch';

const semanticSearchAPI = {
  async processDocument(args) {
    const res = await fetch(`${SEMANTIC_SEARCH_URL}/semanticSearch/searchOneDoc`, {
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
