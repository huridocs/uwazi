import { isSameDate } from 'shared/isSameDate';
import { PropertySchema } from 'shared/types/commonTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';

interface SuggestionValues {
  currentValue: string | number | null;
  labeledValue: string | null;
  suggestedValue: string | null;
  modelCreationDate: number;
  error: string;
  date: number;
}

const equalsForType = (type: PropertySchema['type']) => (first: any, second: any) =>
  type === 'date' ? isSameDate(first, second) : first === second;

const getLabelingState = ({ currentValue, labeledValue }: SuggestionValues) => {
  if (labeledValue) {
    return 'Label';
  }

  if (currentValue) {
    return 'Value';
  }

  return 'Empty';
};

const getMatchingState = (
  { suggestedValue, currentValue }: SuggestionValues,
  propertyType: PropertySchema['type']
) => {
  const equals = equalsForType(propertyType);

  if (suggestedValue === '') {
    return 'Empty';
  }

  if (equals(suggestedValue, currentValue)) {
    return 'Match';
  }

  return 'Mismatch';
};

const getSuggestionState = (
  values: SuggestionValues,
  propertyType: PropertySchema['type']
): SuggestionState => {
  const { modelCreationDate, error, date } = values;

  if (!!error && error !== '') {
    return SuggestionState.error;
  }

  if (date < modelCreationDate) {
    return SuggestionState.obsolete;
  }

  const matchState = getMatchingState(values, propertyType);
  const labelState = getLabelingState(values);

  const state = {
    Empty: {
      Empty: SuggestionState.empty,
      Label: SuggestionState.labelEmpty,
      Value: SuggestionState.valueEmpty,
    },
    Match: {
      Empty: null,
      Label: SuggestionState.labelMatch,
      Value: SuggestionState.valueMatch,
    },
    Mismatch: {
      Empty: SuggestionState.emptyMismatch,
      Label: SuggestionState.labelMismatch,
      Value: SuggestionState.valueMismatch,
    },
  }[matchState][labelState];

  if (state === null) throw new Error('Invalid suggestion state');

  return state;
};

export { getSuggestionState };
export type { SuggestionValues };
