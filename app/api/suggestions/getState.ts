import { SuggestionState } from 'shared/types/suggestionSchema';
import { IXSuggestionType } from 'shared/types/suggestionType';

//update flows:
// - suggestions (i.e. messages from the service - convention: suggestions are unique for file+property)
// - entity (match through entityId)
// - file (match through fileId)
// - related model (match by propertyName)

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
