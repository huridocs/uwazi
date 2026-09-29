import { ObjectId } from 'mongodb';
import { IXSuggestionsDAOFactory } from '../infrastructure/IXSuggestionsDAOFactory.js';

type Input = {
  extractorId: string;
  suggestionIds: string[];
  useForTraining: boolean;
};

type Output = {
  updated: string[];
  useForTraining: boolean;
};

class MarkSuggestionsUseForTrainingUseCase {
  // eslint-disable-next-line class-methods-use-this
  async execute(input: Input): Promise<Output> {
    const extractorId = new ObjectId(input.extractorId);
    const ids = input.suggestionIds.map(id => new ObjectId(id));

    const dao = IXSuggestionsDAOFactory.default();
    const ownedIds = await dao.getIdsOwnedByExtractor(extractorId, ids);

    if (ownedIds.length > 0) {
      await dao.setUseForTraining(ownedIds, input.useForTraining);
    }

    return { updated: ownedIds.map(id => id.toString()), useForTraining: input.useForTraining };
  }
}

export { MarkSuggestionsUseForTrainingUseCase };
