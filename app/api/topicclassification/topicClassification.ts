/**
 * Fetches classifier model configuration for a given thesaurus.
 */
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';
import { buildFullModelName } from 'shared/commonTopicClassification';

import { listModels, getModel } from './api';

export async function getModelForThesaurus(
  thesaurusName: string = ''
): Promise<ClassifierModelSchema> {
  const modelFilter = buildFullModelName(thesaurusName);
  const resultModelNames = await listModels(modelFilter);

  let model: ClassifierModelSchema;
  // we only expect one result, since we've filtered by model already
  switch (resultModelNames.models.length) {
    case 0:
      return Promise.resolve({ name: '', topics: {} });
    case 1:
      model = await getModel({ model: resultModelNames.models[0] });
      model.name = thesaurusName;
      return model;
    default:
      return Promise.reject(
        new Error(
          `Expected one model to exist on the topic classification server but instead there were ${resultModelNames.models.length}.`
        )
      );
  }
}
