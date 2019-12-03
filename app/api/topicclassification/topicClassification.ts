/** @format */

import { EntitySchema } from 'api/entities/entityType';
import { buildModelName } from 'shared/commonTopicClassification';
import { extractSequence } from './common';
import { checkModelReady, getModels, processDocument } from './api';

export async function getAllModels() {
  const results = await getModels();
  return results;
}

export async function modelReady(thesaurusName: string) {
  const modelName = buildModelName(thesaurusName);
  const results = await checkModelReady({ model: modelName });
  return results;
}

export async function classify(e: EntitySchema, thesaurusName: string) {
  const seq = await extractSequence(e);
  const modelName = buildModelName(thesaurusName);
  const results = await processDocument({
    seq,
    model: modelName,
  });
  return results;
}
