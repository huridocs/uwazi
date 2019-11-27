/** @format */

import 'isomorphic-fetch';
import TOPIC_CLASSIFICATION_URL from 'api/config/topicclassification';

const topicClassificationAPI = {
  async processDocument({ seq, model }) {
    const url = new URL(TOPIC_CLASSIFICATION_URL);
    url.searchParams.set('model', model);
    const res = await fetch(TOPIC_CLASSIFICATION_URL, {
      method: 'POST',
      body: JSON.stringify(seq),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const body = await res.json();
    return body;
  },
};

export default topicClassificationAPI;
