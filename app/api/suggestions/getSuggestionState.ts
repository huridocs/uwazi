import moment from 'moment';
import { dateToSeconds } from 'shared/dateToSeconds';
import { PropertySchema } from 'shared/types/commonTypes';
import { SuggestionState } from 'shared/types/suggestionSchema';

interface SuggestionValues {
  _id: any;
  currentValue: string | number | null;
  labeledValue: string | null;
  suggestedValue: string | null;
  modelCreationDate: number;
  error: string;
  date: number;
  propertyName: string;
}

const coerceValue = (text: string | null, propertyType: PropertySchema['type']) => {
  if (!text) return text;

  const trimmedText = text.trim();
  switch (propertyType) {
    case 'numeric':
      return parseFloat(trimmedText) || null;
    case 'date':
      return dateToSeconds(trimmedText);
    default:
      return trimmedText;
  }
};

const isSameDate = (first: number, second: number) => moment(first).isSame(second, 'day');

const equalsForType = (type: PropertySchema['type']) => (first: any, second: any) =>
  type === 'date' ? isSameDate(first, second) : first === second;

// eslint-disable-next-line max-statements
const getSuggestionState = (values: SuggestionValues, propertyType: PropertySchema['type']) => {
  const { currentValue, labeledValue, suggestedValue, modelCreationDate, error, date } = values;
  const coercedLabeledValue = coerceValue(labeledValue, propertyType);
  const equals = equalsForType(propertyType);

  // console.log({ ...values, coercedLabeledValue });

  if (!!error && error !== '') {
    return SuggestionState.error;
  }

  if (date < modelCreationDate) {
    return SuggestionState.obsolete;
  }

  if (!labeledValue && suggestedValue === '' && currentValue !== '') {
    return SuggestionState.valueEmpty;
  }

  // if (suggestedValue === currentValue && suggestedValue === labeledValue) {
  if (suggestedValue === currentValue && equals(suggestedValue, coercedLabeledValue)) {
    return SuggestionState.labelMatch;
  }

  if (currentValue === '' && suggestedValue === '') {
    return SuggestionState.empty;
  }

  if (
    equals(coercedLabeledValue, currentValue) &&
    // labeledValue === currentValue &&
    !equals(coercedLabeledValue, suggestedValue) &&
    // !(labeledValue === suggestedValue) &&
    suggestedValue === ''
  ) {
    return SuggestionState.labelEmpty;
  }

  if (equals(coercedLabeledValue, currentValue) && !equals(coercedLabeledValue, suggestedValue)) {
    // if (labeledValue === currentValue && !(labeledValue === suggestedValue)) {
    return SuggestionState.labelMismatch;
  }

  if (suggestedValue === currentValue) {
    return SuggestionState.valueMatch;
  }

  return SuggestionState.valueMismatch;
};

export { getSuggestionState };
export type { SuggestionValues };
