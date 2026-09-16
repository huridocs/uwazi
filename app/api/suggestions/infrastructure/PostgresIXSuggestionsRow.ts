import {
  IXSuggestionStateType,
  IXSuggestionsModelData,
  IXSuggestionType,
} from '#shared/types/suggestionType.js';

/**
 * One `ix_suggestions` row: the Mongo `ixsuggestions` document with its ids as hex strings and
 * its nested values as JSONB. Absent optional fields are NULL. `page` and `labeledValue` are
 * declared on the type but never written, so they have no column.
 */
type IXSuggestionsRow = {
  _id: string;
  extractorId: string;
  entityId: string;
  entityLanguageId: string | null;
  entityTemplate: string;
  entityTitle: string | null;
  fileId: string | null;
  propertyName: string;
  language: string;
  suggestedValue: unknown;
  suggestedText: string | null;
  currentValue: unknown;
  segment: string | null;
  selectionRectangles: IXSuggestionType['selectionRectangles'] | null;
  status: string;
  error: string | null;
  date: number | null;
  state: IXSuggestionStateType | null;
  modelData: IXSuggestionsModelData | null;
  useForTraining: boolean;
  trainingSample: boolean | null;
};

export type { IXSuggestionsRow };
