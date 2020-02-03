/**
 * @format
 * Fetches classifier model configuration for a given thesaurus.
 */
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';
import { buildFullModelName } from 'shared/commonTopicClassification';

import { listModels, getModel } from './api';

export async function getModelForThesaurus(
  thesaurusName: string = ''
): Promise<ClassifierModelSchema> {
  // list all models
  const modelFilter = buildFullModelName(thesaurusName);
  // filter by db name, thesauri
  // we only expect one result, since we've filtered by model already
  const resultModelNames = await listModels(modelFilter);
  // get all relevant models
  let model: ClassifierModelSchema;
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
