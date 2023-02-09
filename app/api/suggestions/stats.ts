import { ObjectId } from 'mongodb';
import { ObjectIdSchema } from 'shared/types/commonTypes';
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

const addCountsOf = (groups: Groups, _states: SuggestionState[]) => {
  const states = new Set(_states);
  return groups.buckets.filter(g => states.has(g._id)).reduce(addCount, 0);
};

const getGroups = async (extractorId: ObjectIdSchema): Promise<Groups> =>
  IXSuggestionsModel.db
    .aggregate([
      { $match: { extractorId } },
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

const calcAccuracy = (groups: Groups) => {
  const correct = addCountsOf(groups, [SuggestionState.labelMatch, SuggestionState.valueMatch]);
  const incorect = addCountsOf(groups, [
    SuggestionState.labelMismatch,
    SuggestionState.valueMismatch,
    SuggestionState.labelEmpty,
    SuggestionState.valueEmpty,
  ]);
  const total = correct + incorect;
  return total ? correct / total : 0;
};

const getStats = async (_extractorId: string): Promise<SuggestionsStats> => {
  const extractorId = new ObjectId(_extractorId);
  const groups = await getGroups(extractorId);

  const labeled = addCountsOf(groups, [
    SuggestionState.labelMatch,
    SuggestionState.labelMismatch,
    SuggestionState.labelEmpty,
  ]);
  const nonLabeledMatching = addCountsOf(groups, [SuggestionState.valueMatch]);
  const nonLabeledNotMatching = addCountsOf(groups, [SuggestionState.valueMismatch]);
  const emptyOrObsolete = addCountsOf(groups, [
    SuggestionState.empty,
    SuggestionState.obsolete,
    SuggestionState.valueEmpty,
    SuggestionState.emptyMismatch,
  ]);
  const all = groups.all[0]?.count || 0;

  const accuracy = calcAccuracy(groups);

  return {
    counts: {
      labeled,
      nonLabeledMatching,
      nonLabeledNotMatching,
      emptyOrObsolete,
      all,
    },
    accuracy,
  };
};

export { getStats };
