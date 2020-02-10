/** @format */

const { TOPIC_CLASSIFICATION_URL } = process.env;
export const tcServer = TOPIC_CLASSIFICATION_URL || 'http://localhost:5005';
export const useThesaurusNames = true;
