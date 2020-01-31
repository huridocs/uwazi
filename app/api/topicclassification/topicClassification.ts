/** @format */
import { buildModelName } from 'shared/commonTopicClassification';

import { checkModelReady, getModels } from './api';

export async function getAllModels(thesauri: string[]) {
  const results =
    thesauri !== undefined
      ? await Promise.all(
          thesauri.map(async thesaurus => checkModelReady({ model: buildModelName(thesaurus) }))
        )
      : await getModels();
  return results;
}

export async function modelReady(thesaurusName: string) {
  const modelName = buildModelName(thesaurusName);
  const results = await checkModelReady({ model: modelName });
  results.name = thesaurusName;
  return results;
}
