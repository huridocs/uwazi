import { ObjectId } from 'mongodb';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { Suggestions } from 'api/suggestions/suggestions';

type Input = { extractorId: string; batchSize: number; tenantName?: string };

type Output = { processed: number };

export class AcceptSuggestionsUseCase {
  // eslint-disable-next-line class-methods-use-this
  async execute({ extractorId, batchSize }: Input): Promise<Output> {
    const [model] = await ixmodels.get({ extractorId });
    if (!model?.processRun) return { processed: 0 };

    const { autoAccept, suggestionsRunTimestamp } = model.processRun;
    const overwriteAll = autoAccept?.overwriteMode === 'overwrite_all';
    const source = autoAccept?.source === 'all' ? 'all' : 'previous';

    const match: any = {
      extractorId: ObjectId.createFromHexString(extractorId),
      status: 'ready',
      date: { $ne: null },
      'state.withSuggestion': true,
      'state.obsolete': { $ne: true },
      'state.error': { $ne: true },
    };
    if (!overwriteAll) match['state.withValue'] = { $ne: true };
    if (source !== 'all' && suggestionsRunTimestamp) {
      match['modelData.suggestionsRunTimestamp'] = suggestionsRunTimestamp;
    }

    // initialize progress if missing
    if (!model.processRun.autoAcceptProgress?.total) {
      const total = await IXSuggestionsModel.db.countDocuments(match);
      await ixmodels.setAutoAcceptProgress(extractorId, { total, processed: 0 });
    }

    const suggestions = await IXSuggestionsModel.get(match, '_id entityId');
    const toAccept = suggestions.slice(0, batchSize).map(s => ({
      _id: s._id,
      sharedId: s.entityId,
      entityId: s.entityId,
      overwriteAll,
    }));

    if (toAccept.length === 0) {
      await ixmodels.unsetProcessRun(extractorId.toString());
      return { processed: 0 };
    }

    await Suggestions.accept(toAccept as any);
    await ixmodels.incAutoAcceptProcessed(extractorId, toAccept.length);
    return { processed: toAccept.length };
  }
}
