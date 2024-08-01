import { IXExtractorInfo } from 'V2/shared/types';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { TextHighlight } from 'V2/Components/PDFViewer/types';
import { EntitySuggestionType } from 'shared/types/suggestionType';

interface IXProperty extends PropertySchema {
  type: 'text' | 'date' | 'numeric' | 'markdown';
}

type Extractor = IXExtractorInfo & {
  rowId: string;
  namedTemplates: string[];
  propertyLabel: string;
  propertyType: IXProperty['type'];
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
}

interface MultiValueSuggestion extends EntitySuggestionType {
  _id: ObjectIdSchema;
  rowId: string;
  disableRowSelection?: boolean;
  suggestedValue: SuggestionValue[];
  currentValue: SuggestionValue[];
  subRows: SingleValueSuggestion[];
  isChild?: boolean;
}

type TableSuggestion = SingleValueSuggestion | MultiValueSuggestion;

type TableExtractor = Extractor & { rowId: string };

export type {
  Extractor,
  TableExtractor,
  Highlights,
  TableSuggestion,
  SuggestionValue,
  SingleValueSuggestion,
  MultiValueSuggestion,
};
