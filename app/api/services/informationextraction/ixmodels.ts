import { Suggestions } from 'api/suggestions/suggestions';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { IXModelType } from 'shared/types/IXModelType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXModelsModel as model } from './IXModelsModel';

const TEST_RUN_SUGGESTIONS_SIZE = 1000;

type StartTrainingOptions = {
  testRun?: boolean;
};

export default {
  get: model.get.bind(model),
  delete: model.delete.bind(model),
  save: async (ixmodel: IXModelType) => {
    const saved = await model.save(ixmodel);
    if (ixmodel.status === ModelStatus.ready) {
      await Suggestions.setObsolete({ extractorId: saved.extractorId });
    }
    return saved;
  },
  startTraining: async (
    extractorId: ObjectIdSchema,
    { testRun = false }: StartTrainingOptions = {}
  ) => {
    const [current] = await model.get({ extractorId });

    await model.save({
      ...current,
      extractorId,
      findingSuggestions: true,
      status: ModelStatus.processing,
      testRun,
      testRunSuggestionsToFind: TEST_RUN_SUGGESTIONS_SIZE,
    });
  },
  startFindingSuggestions: async (extractorId: ObjectIdSchema) => {
    const [current] = await model.get({ extractorId });

    if (!current) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }

    await model.save({
      ...current,
      findingSuggestions: true,
      status: ModelStatus.processing,
      creationDate: new Date().getTime(),
    });
  },
  stopTraining: async (extractorId: ObjectIdSchema) => {
    const [current] = await model.get({ extractorId });

    if (!current) {
      throw new Error(`Model with extractorId ${extractorId} not found.`);
    }

    await model.save({
      ...current,
      findingSuggestions: false,
      status: ModelStatus.ready,
    });
  },
};

export { TEST_RUN_SUGGESTIONS_SIZE };
