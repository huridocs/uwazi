import { ObjectId } from 'mongodb';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { Suggestions } from 'api/suggestions/suggestions';
import { DataType, UwaziFilterQuery } from 'api/odm';
import { IXSuggestionType } from 'shared/types/suggestionType';

type Input = { extractorId: string; batchSize: number; tenantName?: string };

type Output = { processed: number; progress?: { total: number; processed: number } };

export class AcceptSuggestionsUseCase {
  // eslint-disable-next-line class-methods-use-this
  async execute({ extractorId, batchSize }: Input): Promise<Output> {
    const [model] = await ixmodels.get({ extractorId: ObjectId.createFromHexString(extractorId) });
    // eslint-disable-next-line no-console
    console.log('[IX][accept] useCase.execute::model lookup', {
      extractorId,
      modelFound: !!model,
      hasProcessRun: !!model?.processRun,
    });
    if (!model?.processRun) {
      // Attempt an ObjectId-based lookup just to log whether it exists under that type
      try {
        const [objIdModel] = await ixmodels.get({
          extractorId: ObjectId.createFromHexString(extractorId) as any,
        });
        // eslint-disable-next-line no-console
        console.log('[IX][accept] useCase.execute::secondary lookup with ObjectId', {
          found: !!objIdModel,
          hasProcessRun: !!objIdModel?.processRun,
        });
      } catch (e) {
        console.log('[IX][accept] useCase.execute::secondary lookup error', (e as Error)?.message);
      }
      // eslint-disable-next-line no-console
      console.log('[IX][accept] useCase.execute::early return - missing processRun');
      return { processed: 0 };
    }

    const { autoAccept, suggestionsRunTimestamp } = model.processRun;
    const overwriteAll = autoAccept?.overwriteMode === 'overwrite_all';
    const source = autoAccept?.source === 'all' ? 'all' : 'previous';

    // eslint-disable-next-line no-console
    console.log('[IX][accept] useCase.execute::input', {
      extractorId,
      batchSize,
      overwriteAll,
      source,
      suggestionsRunTimestamp,
    });

    const match: UwaziFilterQuery<DataType<IXSuggestionType>> = {
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
    let total = model.processRun.autoAcceptProgress?.total;
    if (typeof total !== 'number') {
      total = await IXSuggestionsModel.db.countDocuments(match);
      await ixmodels.setAutoAcceptProgress(extractorId, { total, processed: 0 });
      // eslint-disable-next-line no-console
      console.log('[IX][accept] useCase.execute::initialized total', { total });
    }

    // Debug: show the match being used for auto-accept
    // eslint-disable-next-line no-console
    console.log('[IX][accept] useCase.execute::match', match);
    const suggestions = await IXSuggestionsModel.get(
      match,
      '_id entityId entityLanguageId state modelData'
    );
    // eslint-disable-next-line no-console
    console.log('[IX][accept] useCase.execute::fetched suggestions', {
      count: suggestions.length,
      first: suggestions[0]?._id?.toString?.(),
    });
    const toAccept = suggestions.slice(0, batchSize).map(s => ({
      _id: s._id,
      sharedId: s.entityId,
      entityId: s.entityLanguageId,
      overwriteAll,
    }));

    if (toAccept.length === 0) {
      await ixmodels.unsetProcessRun(extractorId.toString());
      // best-effort final snapshot using model's stored progress
      const currentProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
      // eslint-disable-next-line no-console
      console.log('[IX][accept] useCase.execute::done', {
        processed: 0,
        total,
        currentProcessed,
      });
      return { processed: 0, progress: { total, processed: Math.min(total, currentProcessed) } };
    }

    await Suggestions.accept(toAccept as any);
    await ixmodels.incAutoAcceptProcessed(extractorId, toAccept.length);

    const previousProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
    const newProcessed = Math.min(total, previousProcessed + toAccept.length);

    // eslint-disable-next-line no-console
    console.log('[IX][accept] useCase.execute::batch processed', {
      batch: toAccept.length,
      total,
      processed: newProcessed,
    });

    return { processed: toAccept.length, progress: { total, processed: newProcessed } };
  }
}
