import { ObjectId } from 'mongodb';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { Suggestions } from 'api/suggestions/suggestions';
import { DataType, UwaziFilterQuery } from 'api/odm';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { updateStates } from '../updateState';

type Input = { extractorId: string; batchSize: number; tenantName?: string };

type Output = { processed: number; progress?: { total: number; processed: number } };

export class AcceptSuggestionsUseCase {
  // eslint-disable-next-line class-methods-use-this
  async execute({ extractorId, batchSize }: Input): Promise<Output> {
    const [model] = await ixmodels.get({ extractorId: ObjectId.createFromHexString(extractorId) });
    if (!model?.processRun) {
      return { processed: 0 };
    }

    const { autoAccept, suggestionsRunTimestamp, selectedSharedIdsForAutoAccept } =
      model.processRun;
    const overwriteAll = autoAccept?.overwriteMode === 'overwrite_all';
    const source = autoAccept?.source === 'all' ? 'all' : 'previous';

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
    }

    const alreadyProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
    const suggestions = await IXSuggestionsModel.get(
      match,
      '_id entityId entityLanguageId state modelData',
      { skip: alreadyProcessed, limit: batchSize, sort: { _id: 1 } } as any
    );
    const toAccept = suggestions.map(s => ({
      _id: s._id,
      sharedId: s.entityId,
      entityId: s.entityLanguageId,
      overwriteAll,
    }));

    if (toAccept.length === 0) {
      await ixmodels.unsetProcessRun(extractorId.toString());
      // best-effort final snapshot using model's stored progress
      const currentProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
      return { processed: 0, progress: { total, processed: Math.min(total, currentProcessed) } };
    }

    await Suggestions.accept(toAccept as any);
    // Recompute states so accepted ones stop matching subsequent iterations
    const acceptedIds = toAccept.map(a => a._id);
    try {
      const acceptedQuery = { _id: { $in: acceptedIds } };
      await updateStates(acceptedQuery);
    } catch (e) {
      DefaultLogger().info('IX accept: state recompute failed', {
        acceptedIdsCount: acceptedIds.length,
        error: (e as Error)?.message,
      });
    }
    await ixmodels.incAutoAcceptProcessed(extractorId, toAccept.length);

    const previousProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
    const newProcessed = Math.min(total, previousProcessed + toAccept.length);

    return { processed: toAccept.length, progress: { total, processed: newProcessed } };
  }
}
