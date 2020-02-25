/** @format */

import 'isomorphic-fetch';
import SEMANTIC_SEARCH_URL from 'api/config/semanticSearch';

const semanticSearchAPI = {
  async processDocument(args) {
    const res = await fetch(SEMANTIC_SEARCH_URL, {
      method: 'POST',
      body: JSON.stringify(args),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const body = await res.json();
    return body;
  },
};

export default semanticSearchAPI;
