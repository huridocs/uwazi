import { ClientIXExtractorType, ClientTemplateSchema } from 'V2/shared/types';
import { PropertySchema } from 'shared/types/commonTypes';
import { TextHighlight } from 'V2/Components/PDFViewer/types';
import { EntitySuggestionType } from 'shared/types/suggestionType';

type SuggestionOptionValue = { id: string; label: string; segment?: string };

type SuggestionValue = null | string | number | SuggestionOptionValue;

type EntitySuggestion = Omit<EntitySuggestionType, '_id' | 'suggestedValue' | 'currentValue'> & {
  _id: string;
  suggestedValue: SuggestionValue | SuggestionValue[];
  currentValue?: SuggestionValue | SuggestionValue[];
  extractorSource: { pdf?: boolean; property?: string };
  useForTraining: boolean;
};

interface IXProperty extends PropertySchema {
  type: 'text' | 'date' | 'numeric' | 'markdown';
}

type TableExtractor = ClientIXExtractorType & {
  rowId: string;
  namedTemplates: string[];
  propertyLabel: string;
  propertyType: IXProperty['type'];
  source: string;
};

type Highlights = { [page: string]: TextHighlight[] };

interface SingleValueSuggestion extends EntitySuggestion {
  rowId: string;
  disableRowSelection?: boolean;
  isChild?: boolean;
  extractorSource: { pdf?: boolean; property?: string };
}

interface MultiValueSuggestion extends EntitySuggestion {
  rowId: string;
  disableRowSelection?: boolean;
  subRows?: SingleValueSuggestion[];
  isChild?: boolean;
  extractorSource: { pdf?: boolean; property?: string };
}

type TableSuggestion = SingleValueSuggestion | MultiValueSuggestion;

type IXSuggestionsLoaderResponse = {
  suggestions: TableSuggestion[];
  extractor: ClientIXExtractorType;
  templates: ClientTemplateSchema[];
  aggregation: any;
  currentStatus: ixStatus;
  totalPages: number;
  activeFilters: number;
  total: number;
};

type IXFilters = {
  labeled: boolean;
  nonLabeled: boolean;
  useForTraining: boolean;
  match: boolean;
  mismatch: boolean;
  obsolete: boolean;
  error: boolean;
  noContext: boolean;
  nonProcessed: boolean;
};

export enum ixStatus {
  ready = 'ready',
  sending_labeled_data = 'sending_labeled_data',
  processing_model = 'processing_model',
  processing_suggestions = 'processing_suggestions',
  processing_auto_accept = 'processing_auto_accept',
  cancel = 'cancel',
  error = 'error',
}

export type {
  IXFilters,
  EntitySuggestion,
  TableExtractor,
  Highlights,
  TableSuggestion,
  SingleValueSuggestion,
  MultiValueSuggestion,
  IXSuggestionsLoaderResponse,
  SuggestionValue,
};
