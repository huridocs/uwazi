import { isSameDate } from 'shared/isSameDate';
import { PropertySchema } from 'shared/types/commonTypes';
import { IXSuggestionStateType } from './types/suggestionType';
import { setsEqual } from './data_utils/setUtils';
import { propertyIsSelectOrMultiSelect } from './propertyTypes';

interface SuggestionValues {
  currentValue: (string | number | null)[];
  labeledValue: string | null;
  suggestedValue: string | null;
  modelCreationDate: number;
  error: string;
  date: number;
  segment: string | null;
  state: string | null;
  status: string | null;
}

const sameValueSet = (first: any, second: any) => setsEqual(first || [], second || []);

const EQUALITIES: Record<string, (first: any, second: any) => boolean> = {
  date: isSameDate,
  multiselect: sameValueSet,
};

const equalsForType = (type: PropertySchema['type']) => (first: any, second: any) =>
  EQUALITIES[type] ? EQUALITIES[type](first, second) : first === second;

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
    this.setLabeled(values, propertyType);
    this.setWithValue(values);
    this.setWithSuggestion(values);
    this.setMatch(values, propertyType);
    this.setHasContext(values, propertyType);
    this.setObsolete(values);
    this.setProcessing(values);
    this.setError(values);
  }

  setLabeled(
    { labeledValue, currentValue }: SuggestionValues,
    propertyType: PropertySchema['type']
  ) {
    if (
      labeledValue ||
      (propertyIsSelectOrMultiSelect(propertyType) && currentValue && currentValue.length > 0)
    ) {
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

  setHasContext({ segment }: SuggestionValues, propertyType: PropertySchema['type']) {
    if (segment || propertyIsSelectOrMultiSelect(propertyType)) {
      this.hasContext = true;
    }
  }

  setObsolete({ modelCreationDate, date }: SuggestionValues) {
    if (date < modelCreationDate) {
      this.obsolete = true;
    }
  }

  setProcessing({ status }: SuggestionValues) {
    if (status === 'processing') {
      this.processing = true;
    }
  }

  setError({ error, status }: SuggestionValues) {
    if ((error && error !== '') || (status && status === 'failed')) {
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
