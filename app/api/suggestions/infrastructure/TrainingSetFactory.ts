import { MarkSuggestionsUseForTrainingUseCase } from '../application/MarkSuggestionsUseForTrainingUseCase';

const TrainingSetFactory = {
  createUseCase: () => new MarkSuggestionsUseForTrainingUseCase(),
};

export { TrainingSetFactory };
