import { SuggestionState } from 'shared/types/suggestionSchema';

interface SuggestionValues {
  _id: any;
  currentValue: string | number | null;
  labeledValue: string | null;
  suggestedValue: string | null;
  modelCreationDate: number;
  error: string;
  date: number;
}

// eslint-disable-next-line max-statements
const getSuggestionState = (values: SuggestionValues) => {
  const { currentValue, labeledValue, suggestedValue, modelCreationDate, error, date } = values;

  if (!!error && error !== '') {
    return SuggestionState.error;
  }

  if (date < modelCreationDate) {
    return SuggestionState.obsolete;
  }

  if (!labeledValue && suggestedValue === '' && currentValue !== '') {
    return SuggestionState.valueEmpty;
  }

  if (suggestedValue === currentValue && suggestedValue === labeledValue) {
    return SuggestionState.labelMatch;
  }

  if (currentValue === '' && suggestedValue === '') {
    return SuggestionState.empty;
  }

  if (labeledValue === currentValue && labeledValue !== suggestedValue && suggestedValue === '') {
    return SuggestionState.labelEmpty;
  }

  if (labeledValue === currentValue && labeledValue !== suggestedValue) {
    return SuggestionState.labelMismatch;
  }

  if (suggestedValue === currentValue) {
    return SuggestionState.valueMatch;
  }

  return SuggestionState.valueMismatch;
};

export { getSuggestionState };
export type { SuggestionValues };
