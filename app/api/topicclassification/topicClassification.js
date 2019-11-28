/** @format */

import api from './api';
import { buildModelName, extractSequence } from './common';

const processDocument = async (e, thesaurus) => {
  const seq = extractSequence(e);
  const modelName = buildModelName(thesaurus);
  const results = await api.processDocument({
    seq,
    model: modelName,
  });
  return results;
};

const topicClassification = {
  processDocument,
};

export default topicClassification;
