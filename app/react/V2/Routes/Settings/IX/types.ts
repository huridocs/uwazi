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
  isChild?: boolean;
  suggestedValue: SuggestionValue;
  currentValue?: SuggestionValue;
  disableRowSelection?: boolean;
}

interface MultiValueSuggestion extends EntitySuggestionType {
  _id: ObjectIdSchema;
  isChild?: boolean;
  suggestedValue: SuggestionValue[];
  currentValue: SuggestionValue[];
  children: SingleValueSuggestion[];
  disableRowSelection?: boolean;
}

type TableSuggestion = SingleValueSuggestion | MultiValueSuggestion;

export type {
  Extractor,
  Highlights,
  TableSuggestion,
  SuggestionValue,
  SingleValueSuggestion,
  MultiValueSuggestion,
};
