import { SuggestionState } from 'shared/types/suggestionSchema';
import { IXSuggestionType } from 'shared/types/suggestionType';

export const getState = (
  suggestion: IXSuggestionType,
  modelCreationDate: number,
  labeledValue: string | undefined,
  currentValue: string
) => {
  if (suggestion.error) return 'Error';

  const suggestedValue = suggestion.suggestedValue || '';

  if (suggestion.date !== undefined && suggestion.date <= modelCreationDate) {
    return SuggestionState.obsolete;
  }

  if (!labeledValue && suggestedValue === '' && currentValue !== '') {
    return SuggestionState.valueEmpty;
  }

  if (labeledValue === suggestedValue && currentValue === suggestedValue) {
    return SuggestionState.labelMatch;
  }

  if (suggestedValue === '' && currentValue === '') {
    return SuggestionState.empty;
  }

  if (suggestedValue === '' && labeledValue !== '' && labeledValue === currentValue) {
    return SuggestionState.labelEmpty;
  }

  if (labeledValue !== '' && labeledValue === currentValue) {
    return SuggestionState.labelMismatch;
  }

  if (suggestedValue === currentValue) {
    return SuggestionState.valueMatch;
  }

  return SuggestionState.valueMismatch;
};
