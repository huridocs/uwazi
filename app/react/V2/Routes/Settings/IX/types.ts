import { IXExtractorInfo } from 'V2/shared/types';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { TextHighlight } from 'V2/Components/PDFViewer/types';
import { EntitySuggestionType } from 'shared/types/suggestionType';

interface IXProperty extends PropertySchema {
  type: 'text' | 'date' | 'numeric' | 'markdown';
}

type Extractor = IXExtractorInfo & {
  namedTemplates: string[];
  propertyLabel: string;
  propertyType: IXProperty['type'];
};

type Highlights = { [page: string]: TextHighlight[] };

type SuggestionValue = string | number;

interface ChildrenSuggestion {
  suggestedValue?: SuggestionValue;
  currentValue?: SuggestionValue;
  propertyName: string;
  disableRowSelection?: boolean;
  entityId: ObjectIdSchema;
  sharedId: string;
  _id: ObjectIdSchema;
  isChild?: boolean;
}

interface TableSuggestion extends EntitySuggestionType {
  children?: ChildrenSuggestion[];
  isChild?: boolean;
  suggestedValue: SuggestionValue | SuggestionValue[];
  currentValue?: SuggestionValue | SuggestionValue[];
}

export type { Extractor, Highlights, ChildrenSuggestion, TableSuggestion, SuggestionValue };
