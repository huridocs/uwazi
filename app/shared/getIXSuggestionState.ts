import { isSameDate } from 'shared/isSameDate';
import { PropertySchema } from 'shared/types/commonTypes';
import { IXSuggestionStateType } from './types/suggestionType';

interface SuggestionValues {
  currentValue: string | number | null;
  labeledValue: string | null;
  suggestedValue: string | null;
  modelCreationDate: number;
  error: string;
  date: number;
  segment: string | null;
  state: string | null;
}

const equalsForType = (type: PropertySchema['type']) => (first: any, second: any) =>
  type === 'date' ? isSameDate(first, second) : first === second;

class IXSuggestionState implements IXSuggestionStateType {
  labeled = false;

  withValue = false;

  withSuggestion = false;

  match = false;

  hasContext = false;

  obsolete = false;

  processing = false;

  error = false;

  constructor(values: SuggestionValues, propertyType: PropertySchema['type']) {
    this.setLabeled(values);
    this.setWithValue(values);
    this.setWithSuggestion(values);
    this.setMatch(values, propertyType);
    this.setHasContext(values);
    this.setObsolete(values);
    this.setProcessing(values);
    this.setError(values);
  }

  setLabeled({ labeledValue }: SuggestionValues) {
    if (labeledValue) {
      this.labeled = true;
    }
  }

  setWithValue({ currentValue }: SuggestionValues) {
    if (currentValue) {
      this.withValue = true;
    }
  }

  setWithSuggestion({ suggestedValue }: SuggestionValues) {
    if (suggestedValue) {
      this.withSuggestion = true;
    }
  }

  setMatch(
    { suggestedValue, currentValue }: SuggestionValues,
    propertyType: PropertySchema['type']
  ) {
    const equals = equalsForType(propertyType);

    if (suggestedValue === '') {
      this.withSuggestion = false;
    } else if (equals(suggestedValue, currentValue)) {
      this.match = true;
    }
  }

  setHasContext({ segment }: SuggestionValues) {
    if (segment) {
      this.hasContext = true;
    }
  }

  setObsolete({ modelCreationDate, date }: SuggestionValues) {
    if (date < modelCreationDate) {
      this.obsolete = true;
    }
  }

  setProcessing({ state }: SuggestionValues) {
    if (state === 'processing') {
      this.processing = true;
    }
  }

  setError({ error }: SuggestionValues) {
    if (error && error !== '') {
      this.error = true;
    }
  }
}

const getSuggestionState = (
  values: SuggestionValues,
  propertyType: PropertySchema['type']
): IXSuggestionStateType => {
  const state = new IXSuggestionState(values, propertyType);

  return state;
};

export { getSuggestionState };
export type { SuggestionValues };
