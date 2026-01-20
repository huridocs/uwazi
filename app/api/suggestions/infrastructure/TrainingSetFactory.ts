import { MarkSuggestionsUseForTrainingUseCase } from '#api/suggestions/application/MarkSuggestionsUseForTrainingUseCase.js';

const TrainingSetFactory = {
  createUseCase: () => new MarkSuggestionsUseForTrainingUseCase(),
};

export { TrainingSetFactory };
