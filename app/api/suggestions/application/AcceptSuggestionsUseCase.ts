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

    const { autoAccept, suggestionsRunTimestamp, selectedSharedIdsForAutoAccept } =
      model.processRun;
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

    const baseMatch: UwaziFilterQuery<DataType<IXSuggestionType>> = {
      extractorId: ObjectId.createFromHexString(extractorId),
      status: 'ready',
      date: { $ne: null },
      'state.withSuggestion': true,
      'state.obsolete': { $ne: true },
      'state.error': { $ne: true },
    };
    if (!overwriteAll) (baseMatch as any)['state.withValue'] = { $ne: true };

    // Scope to this run: by run timestamp OR by selected cohort (for process_selected)
    let match: UwaziFilterQuery<DataType<IXSuggestionType>> = baseMatch;
    if (source !== 'all') {
      const orClauses: any[] = [];
      if (suggestionsRunTimestamp) {
        orClauses.push({ 'modelData.suggestionsRunTimestamp': suggestionsRunTimestamp });
      }
      if (Array.isArray(selectedSharedIdsForAutoAccept) && selectedSharedIdsForAutoAccept.length) {
        orClauses.push({ entityId: { $in: selectedSharedIdsForAutoAccept } });
      }
      if (orClauses.length) {
        match = { ...(baseMatch as any), $or: orClauses } as any;
      }
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
    console.log('[IX][accept] useCase.execute::match', JSON.stringify(match));
    const preCount = await IXSuggestionsModel.db.countDocuments(match);
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
    // Recompute states so accepted ones stop matching subsequent iterations
    try {
      const acceptedIds = toAccept.map(a => a._id);
      const acceptedQuery = { _id: { $in: acceptedIds } };
      const { updateStates } = await import('api/suggestions/updateState');
      await updateStates(acceptedQuery);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('[IX][accept] state recompute failed', (e as Error).message);
    }
    await ixmodels.incAutoAcceptProcessed(extractorId, toAccept.length);

    // If nothing was effectively reduced from the match, avoid redispatch to prevent loops
    const postCount = await IXSuggestionsModel.db.countDocuments(match);
    if (postCount >= preCount) {
      // eslint-disable-next-line no-console
      console.log('[IX][accept] useCase.execute::no progress detected, stopping redispatch', {
        preCount,
        postCount,
      });
      return {
        processed: 0,
        progress: { total, processed: model.processRun.autoAcceptProgress?.processed ?? 0 },
      };
    }

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
