import { ClientIXExtractorType } from 'V2/shared/types';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { TextHighlight } from 'V2/Components/PDFViewer/types';
import { EntitySuggestionType } from 'shared/types/suggestionType';

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

type SuggestionValue = string | number;

interface SingleValueSuggestion extends EntitySuggestionType {
  _id: ObjectIdSchema;
  rowId: string;
  disableRowSelection?: boolean;
  suggestedValue: SuggestionValue;
  currentValue?: SuggestionValue;
  isChild?: boolean;
  extractorSource: { pdf?: boolean; property?: string };
}

interface MultiValueSuggestion extends EntitySuggestionType {
  _id: ObjectIdSchema;
  rowId: string;
  disableRowSelection?: boolean;
  suggestedValue: SuggestionValue[];
  currentValue: SuggestionValue[];
  subRows: SingleValueSuggestion[];
  isChild?: boolean;
  extractorSource: { pdf?: boolean; property?: string };
}

type TableSuggestion = SingleValueSuggestion | MultiValueSuggestion;

export enum ixStatus {
  ready = 'ready',
  sending_labeled_data = 'sending_labeled_data',
  processing_model = 'processing_model',
  processing_suggestions = 'processing_suggestions',
  cancel = 'cancel',
  error = 'error',
}

export type {
  TableExtractor,
  Highlights,
  TableSuggestion,
  SuggestionValue,
  SingleValueSuggestion,
  MultiValueSuggestion,
};
