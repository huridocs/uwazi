import { SuggestionState } from 'shared/types/suggestionSchema';
import { SuggestionsStats } from 'shared/types/suggestionStats';
import { IXSuggestionsModel } from './IXSuggestionsModel';

interface StateGroup<T> {
  _id: T;
  count: number;
}

interface Groups {
  buckets: StateGroup<SuggestionState>[];
  all: StateGroup<'all'>[];
}

const addCount = <T>(sum: number, group: StateGroup<T>) => sum + group.count;

const addCountsOf = (groups: Groups, states: SuggestionState[]) =>
  groups.buckets.filter(g => states.includes(g._id)).reduce(addCount, 0);

const getGroups = async (propertyName: string): Promise<Groups> =>
  IXSuggestionsModel.db
    .aggregate([
      { $match: { propertyName } },
      {
        $facet: {
          buckets: [
            {
              $group: {
                _id: '$state',
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          all: [
            {
              $count: 'count',
            },
          ],
        },
      },
    ])
    .then(([result]) => result);

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
  const emptyOrObsolete = addCountsOf(groups, [
    SuggestionState.empty,
    SuggestionState.obsolete,
    SuggestionState.valueEmpty,
  ]);
  const all = groups.all[0].count;

  return {
    data: {
      labeledMatching,
      labeled,
      nonLabeledMatching,
      nonLabeledOthers,
      emptyOrObsolete,
      all,
    },
  };
};

export { getStats };
