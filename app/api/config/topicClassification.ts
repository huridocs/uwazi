import isReachable from 'is-reachable';

const { TOPIC_CLASSIFICATION_URL } = process.env;
export const tcServer = TOPIC_CLASSIFICATION_URL || 'http://localhost:5005';
export const useThesaurusNames = true;

export const RPC_DEADLINE_MS = 1000;

export async function IsTopicClassificationReachable() {
  if (!tcServer || tcServer === 'none') {
    return false;
  }
  return isReachable(tcServer, { timeout: RPC_DEADLINE_MS });
}
