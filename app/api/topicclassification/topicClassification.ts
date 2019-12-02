/** @format */

import { EntitySchema } from 'api/entities/entityType';
import { checkModelReady, getModels, processDocument } from './api';
import { buildModelName, extractSequence } from './common';

export async function getAllModels() {
  console.dir('getAllModels');
  const results = await getModels();
  return results;
}

export async function modelReady(thesaurusName: string) {
  console.dir('modelReady', thesaurusName);
  const modelName = buildModelName(thesaurusName);
  const results = await checkModelReady({ model: modelName });
  return results;
}

export async function classify(e: EntitySchema, thesaurusName: string) {
  console.dir('classify', thesaurusName);
  const seq = await extractSequence(e);
  const modelName = buildModelName(thesaurusName);
  const results = await processDocument({
    seq,
    model: modelName,
  });
  return results;
}
