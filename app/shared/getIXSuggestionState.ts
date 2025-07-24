import { isSameDate } from 'shared/isSameDate';
import { PropertySchema } from 'shared/types/commonTypes';
import {
  IXSuggestionStateType,
  IXSuggestionType,
  SuggestionOptionValue,
} from './types/suggestionType';
import { setsEqual } from './data_utils/setUtils';
import {
  propertyIsMultiselect,
  propertyIsRelationship,
  propertyIsSelectOrMultiSelect,
} from './propertyTypes';

const propertyIsMultiValued = (propertyType: PropertySchema['type']) =>
  propertyIsMultiselect(propertyType) || propertyIsRelationship(propertyType);

type CurrentValue = string | number | null;
type SuggestedValue = string | SuggestionOptionValue[] | null;

interface SuggestionValues {
  currentValue: IXSuggestionType['currentValue'];
  suggestedValue: IXSuggestionType['currentValue'];
  error: string;
  date: number;
  segment: string | null;
  status: string | null;
  obsolete: boolean;
}

const sameValueSet = (first: string[], second: string[]) => setsEqual(first || [], second || []);

const normalizeToIds = (value: CurrentValue | CurrentValue[] | SuggestedValue): string[] => {
  const toId = (v: any): string | null => {
    if (v == null) return null;
    if (typeof v === 'object' && typeof v.id === 'string') return v.id;
    return String(v);
  };

  if (value == null) return [];

  const array = Array.isArray(value) ? value : [value];
  return array.map(toId).filter((id): id is string => Boolean(id));
};

const EQUALITIES: Record<string, (first: any, second: any) => boolean> = {
  date: isSameDate,
  multiselect: sameValueSet,
  relationship: sameValueSet,
};

const equalsForType = (type: PropertySchema['type']) => (first: any, second: any) => {
  const equalityFn = EQUALITIES[type];
  if (equalityFn) {
    return equalityFn(normalizeToIds(first), normalizeToIds(second));
  }

  return normalizeToIds(first)[0] === normalizeToIds(second)[0];
};

class IXSuggestionState implements IXSuggestionStateType {
  labeled = false;

  withValue = false;

  withSuggestion = false;

  match: boolean | undefined;

  hasContext = false;

  obsolete = false;

  processing = false;

  error = false;

  constructor(values: SuggestionValues, propertyType: PropertySchema['type']) {
    this.setLabeled(values, propertyType);
    this.setWithValue(values, propertyType);
    this.setWithSuggestion(values, propertyType);
    this.setMatch(values, propertyType);
    this.setHasContext(values, propertyType);
    this.setObsolete(values);
    this.setProcessing(values);
    this.setError(values);
  }

  setLabeled({ currentValue }: SuggestionValues, propertyType: PropertySchema['type']) {
    if (propertyIsMultiValued(propertyType) && Array.isArray(currentValue)) {
      this.labeled = currentValue?.length > 0;
    } else if (currentValue) {
      this.labeled = true;
    }
  }

  setWithValue({ currentValue }: SuggestionValues, propertyType: PropertySchema['type']) {
    if (propertyIsMultiValued(propertyType) && Array.isArray(currentValue)) {
      this.withValue = currentValue?.length > 0;
    } else if (currentValue) {
      this.withValue = true;
    }
  }

  setWithSuggestion({ suggestedValue }: SuggestionValues, propertyType: PropertySchema['type']) {
    if (propertyIsMultiValued(propertyType) && Array.isArray(suggestedValue)) {
      this.withSuggestion = suggestedValue?.length > 0;
    } else if (suggestedValue) {
      this.withSuggestion = true;
    }
  }

  setMatch(
    { suggestedValue, currentValue }: SuggestionValues,
    propertyType: PropertySchema['type']
  ) {
    const equals = equalsForType(propertyType);

    this.match = false;

    if (
      suggestedValue !== '' &&
      (!Array.isArray(suggestedValue) || suggestedValue.length !== 0) &&
      equals(suggestedValue, currentValue)
    ) {
      this.match = true;
    }
  }

  setHasContext({ segment }: SuggestionValues, propertyType: PropertySchema['type']) {
    if (
      segment ||
      propertyIsSelectOrMultiSelect(propertyType) ||
      propertyIsRelationship(propertyType)
    ) {
      this.hasContext = true;
    }
  }

  setObsolete({ obsolete }: SuggestionValues) {
    if (obsolete) {
      this.obsolete = true;
      this.match = undefined;
    }
  }

  setProcessing({ status }: SuggestionValues) {
    if (status === 'processing') {
      this.processing = true;
      this.obsolete = true;
      this.match = undefined;
    }
  }

  setError({ error, status }: SuggestionValues) {
    if ((error && error !== '') || (status && status === 'failed')) {
      this.error = true;
      this.match = undefined;
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

export { getSuggestionState, propertyIsMultiValued };
export type { CurrentValue, SuggestionValues };
