import { ObjectId } from 'mongodb';
import { IXSuggestionsDAOFactory } from '#api/suggestions/infrastructure/IXSuggestionsDAOFactory.js';
import { RunScope } from '#api/suggestions/domain/IXSuggestionsDataSource.js';
import ixmodels from '#api/services/informationextraction/ixmodels.js';
import { Suggestions } from '#api/suggestions/suggestions.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { recomputeStatesForIds } from '../updateState.js';

type Input = { extractorId: string; batchSize: number; tenantName?: string };

type Output = { processed: number; progress?: { total: number; processed: number } };

export class AcceptSuggestionsUseCase {
  // eslint-disable-next-line class-methods-use-this
  async execute({ extractorId, batchSize }: Input): Promise<Output> {
    const model = await ixmodels.getByExtractorId(ObjectId.createFromHexString(extractorId));
    if (!model?.processRun) {
      return { processed: 0 };
    }

    const { autoAccept, suggestionsRunTimestamp, selectedSharedIdsForAutoAccept, mode } =
      model.processRun;
    const overwriteAll = autoAccept?.overwriteMode === 'overwrite_all';
    const source = autoAccept?.source === 'all' ? 'all' : 'previous';

    // Scope to this run
    // - process_selected: strictly selected cohort (no OR with run timestamp)
    // - others (process_extractor/accept-only with source 'previous'): scope by run timestamp
    let scope: RunScope = { kind: 'all' };
    if (source !== 'all') {
      if (mode === 'process_selected') {
        scope = { kind: 'entities', entityIds: selectedSharedIdsForAutoAccept ?? [] };
      } else if (suggestionsRunTimestamp) {
        scope = { kind: 'run', runTimestamp: suggestionsRunTimestamp };
      }
    }

    const acceptanceQuery = {
      extractorId: ObjectId.createFromHexString(extractorId),
      scope,
      includeAlreadyValued: overwriteAll,
    };

    // initialize progress if missing
    let total = model.processRun.autoAcceptProgress?.total;
    if (typeof total !== 'number') {
      total = await IXSuggestionsDAOFactory.default().countAcceptable(acceptanceQuery);
      await ixmodels.setAutoAcceptProgress(extractorId, { total, processed: 0 });
    } else {
      /* empty */
    }

    // Fetch first page; rely on state recompute to shrink the set between batches
    // Decide pagination strategy:
    // - source === 'all': dataset may not shrink → use stable sort + skip = processed
    // - source !== 'all' (previous): dataset shrinks via state recompute → always take first page
    const alreadyProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
    // Use skip paging for non-shrinking sets: overwrite_all (regardless of source)
    const useSkipPaging = overwriteAll === true;

    const suggestions = await IXSuggestionsDAOFactory.default().getAcceptable(
      acceptanceQuery,
      useSkipPaging ? { skip: alreadyProcessed, limit: batchSize } : { limit: batchSize }
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
      await recomputeStatesForIds(acceptedIds);
    } catch (e) {
      LoggerFactory.default().info('IX accept: state recompute failed', {
        acceptedIdsCount: acceptedIds.length,
        error: (e as Error)?.message,
      });
    }
    await ixmodels.incAutoAcceptProcessed(extractorId, toAccept.length);

    const previousProcessed = model.processRun.autoAcceptProgress?.processed ?? 0;
    const newProcessed = Math.min(total, previousProcessed + toAccept.length);
    // Update progress persisted value for next iteration readers
    await ixmodels.setAutoAcceptProgress(extractorId, { processed: newProcessed });

    return { processed: toAccept.length, progress: { total, processed: newProcessed } };
  }
}
