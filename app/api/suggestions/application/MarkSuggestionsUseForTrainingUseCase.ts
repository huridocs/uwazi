import { ObjectId } from 'mongodb';
import { IXSuggestionsModel } from '../IXSuggestionsModel';

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

    const suggestions = await IXSuggestionsModel.db
      .find({ _id: { $in: ids }, extractorId })
      .select({ _id: 1 })
      .lean();

    const ownedIds = suggestions.map(s => s._id);

    if (ownedIds.length > 0) {
      await IXSuggestionsModel.updateMany(
        { _id: { $in: ownedIds } },
        { $set: { useForTraining: input.useForTraining } }
      );
    }

    return { updated: ownedIds.map(id => id.toString()), useForTraining: input.useForTraining };
  }
}

export { MarkSuggestionsUseForTrainingUseCase };
