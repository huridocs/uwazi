import { MarkSuggestionsUseForTrainingUseCase } from '../application/MarkSuggestionsUseForTrainingUseCase.js';

const TrainingSetFactory = {
  createUseCase: () => new MarkSuggestionsUseForTrainingUseCase(),
};

export { TrainingSetFactory };
