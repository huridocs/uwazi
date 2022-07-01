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

const coerceValue = (text: string | null, propertyType: PropertySchema['type'] | undefined) => {
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

const isSameDate = (first: number, second: number) => {
  // console.log(moment.unix(first).utc().toISOString(), moment.unix(second).utc().toISOString());
  return moment.unix(first).utc().isSame(moment.unix(second).utc(), 'day');
};

const equalsForType = (type: PropertySchema['type']) => (first: any, second: any) =>
  type === 'date' ? isSameDate(first, second) : first === second;

// // eslint-disable-next-line max-statements
// const getSuggestionState = (values: SuggestionValues, propertyType: PropertySchema['type']) => {
//   const { currentValue, labeledValue, suggestedValue, modelCreationDate, error, date } = values;
//   const coercedLabeledValue = coerceValue(labeledValue, propertyType);
//   const equals = equalsForType(propertyType);

//   console.log({ ...values, coercedLabeledValue });

//   if (!!error && error !== '') {
//     return SuggestionState.error;
//   }

//   if (date < modelCreationDate) {
//     return SuggestionState.obsolete;
//   }

//   if (!labeledValue && suggestedValue === '' && currentValue !== '') {
//     return SuggestionState.valueEmpty;
//   }

//   // if (suggestedValue === currentValue && suggestedValue === labeledValue) {
//   if (suggestedValue === currentValue && equals(suggestedValue, coercedLabeledValue)) {
//     return SuggestionState.labelMatch;
//   }

//   if (currentValue === '' && suggestedValue === '') {
//     return SuggestionState.empty;
//   }

//   if (
//     equals(coercedLabeledValue, currentValue) &&
//     // labeledValue === currentValue &&
//     !equals(coercedLabeledValue, suggestedValue) &&
//     // !(labeledValue === suggestedValue) &&
//     suggestedValue === ''
//   ) {
//     return SuggestionState.labelEmpty;
//   }

//   console.log('equals(coercedLabeledValue, suggestedValue)', equals(coercedLabeledValue, suggestedValue));
//   console.log('equals(coercedLabeledValue, currentValue)', equals(coercedLabeledValue, currentValue));
//   if (equals(coercedLabeledValue, currentValue) && !equals(coercedLabeledValue, suggestedValue)) {
//     // if (labeledValue === currentValue && !(labeledValue === suggestedValue)) {
//     return SuggestionState.labelMismatch;
//   }

//   if (suggestedValue === currentValue) {
//     return SuggestionState.valueMatch;
//   }

//   return SuggestionState.valueMismatch;
// };

const getLabelingState = ({ currentValue, labeledValue }: SuggestionValues) => {
  if (labeledValue) {
    return 'Label';
  }

  if (currentValue) {
    return 'Value';
  }

  return 'Empty';
};

const getSuggestionState = (
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

const getState = (
  values: SuggestionValues,
  propertyType: PropertySchema['type']
): SuggestionState => {
  // console.log(values);
  const { modelCreationDate, error, date } = values;

  if (!!error && error !== '') {
    return SuggestionState.error;
  }

  if (date < modelCreationDate) {
    return SuggestionState.obsolete;
  }

  const matchState = getSuggestionState(values, propertyType);
  const labelState = getLabelingState(values);

  // console.log(values)
  // console.log(matchState, labelState)

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
      Empty: SuggestionState.valueMismatch,
      Label: SuggestionState.labelMismatch,
      Value: SuggestionState.valueMismatch,
    },
  }[matchState][labelState];

  if (state === null) throw new Error('Invalid suggestion state');

  // console.log(state);
  return state;
};

export { coerceValue, getState as getSuggestionState };
export type { SuggestionValues };
