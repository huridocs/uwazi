import { UseCase } from 'api/common.v2/contracts/UseCase';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { EnforcedWithId } from 'api/odm';
import { IXModelType } from 'shared/types/IXModelType';
import ixmodels from 'api/services/informationextraction/ixmodels';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { Suggestions } from 'api/suggestions/suggestions';
// IXServices intentionally not used directly here

type Input = { extractorId: ObjectIdSchema };
type Output = { queued: number };

export class AutoAcceptSuggestions implements UseCase<Input, Output> {
  private static async buildAcceptanceSet(model: EnforcedWithId<IXModelType>) {
    const processRun: any = (model as any)?.processRun || {};
    const auto = processRun.autoAccept || {};
    const source = auto.source === 'all' ? 'all' : 'previous';
    const overwriteAll = auto.overwriteMode === 'overwrite_all';

    // Query suggestions: from previous run or all
    const baseMatch: any = { extractorId: model.extractorId, status: 'ready' };
    if (source === 'previous' && model.processRun?.suggestionsRunTimestamp) {
      baseMatch['modelData.suggestionsRunTimestamp'] = model.processRun.suggestionsRunTimestamp;
    }

    // Avoid re-accepting obsolete/error/nonProcessed and require that a suggestion exists
    baseMatch['state.obsolete'] = { $ne: true };
    baseMatch['state.error'] = { $ne: true };
    baseMatch.date = { $ne: null };
    baseMatch['state.withSuggestion'] = true;

    // If accepting only when entity has blank target property, use state.withValue flag
    if (!overwriteAll) {
      baseMatch['state.withValue'] = { $ne: true };
    }

    const suggestions = (await IXSuggestionsModel.db.aggregate([
      { $match: baseMatch },
      { $project: { _id: 1, sharedId: '$entityId', entityId: 1 } },
    ])) as { _id: any; sharedId: string; entityId: string }[];

    if (!suggestions.length) return [];

    // Build acceptance payload with overwrite rules evaluated later in updateEntities
    return suggestions.map(s => ({
      _id: s._id,
      sharedId: s.sharedId,
      entityId: s.entityId,
      overwriteAll,
    }));
  }

  async execute({ extractorId }: Input): Promise<Output> {
    const [model] = await ixmodels.get({ extractorId });
    if (!model) return { queued: 0 };

    const toAccept = await AutoAcceptSuggestions.buildAcceptanceSet(model as any);
    if (toAccept.length === 0) return { queued: 0 };

    // Delegate to Suggestions.accept which performs entity updates
    await Suggestions.accept(toAccept as any);
    return { queued: toAccept.length };
  }
}
