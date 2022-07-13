import { SuggestionState } from 'shared/types/suggestionSchema';
import { SuggestionsStats } from 'shared/types/suggestionStats';
import { IXSuggestionsModel } from './IXSuggestionsModel';

interface StateGroup {
  _id: SuggestionState;
  count: number;
}

const addCount = (sum: number, group: StateGroup) => sum + group.count;

const addCountsOf = (groups: StateGroup[], states: SuggestionState[]) =>
  groups.filter(g => states.includes(g._id)).reduce(addCount, 0);

const getGroups = async (propertyName: string) =>
  IXSuggestionsModel.db.aggregate([
    { $match: { propertyName } },
    {
      $group: {
        _id: '$state',
        count: {
          $sum: 1,
        },
      },
    },
  ]);

const getStats = async (propertyName: string): Promise<SuggestionsStats> => {
  const groups = await getGroups(propertyName);

  const labeledMatching = addCountsOf(groups, [SuggestionState.labelMatch]);
  const labeled = addCountsOf(groups, [
    SuggestionState.labelMatch,
    SuggestionState.labelMismatch,
    SuggestionState.labelEmpty,
  ]);
  const nonLabeledMatching = addCountsOf(groups, [SuggestionState.valueMatch]);
  const nonLabeledOthers = addCountsOf(groups, [
    SuggestionState.valueMismatch,
    SuggestionState.emptyMismatch,
  ]);
  const emptyOrObsolete = addCountsOf(groups, [SuggestionState.empty, SuggestionState.obsolete, SuggestionState.valueEmpty ]);

  return {
    data: { labeledMatching, labeled, nonLabeledMatching, nonLabeledOthers, emptyOrObsolete },
  };
};

export { getStats };
