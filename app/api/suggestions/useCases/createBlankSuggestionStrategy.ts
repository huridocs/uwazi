import { IXExtractorType } from 'shared/types/extractorType';
import { CreateBlankSuggestionsForPdf } from './createBlankSuggestionsForPdf';
import { CreateBlankSuggestionsForProperty } from './createBlankSuggestionsForProperty';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';

export type CreateBlankSuggestionsInput = {
  templateId: string;
  isMultiValued: boolean;
  extractor: IXExtractorType;
  targetProperty: PropertySchema;
  entities: Required<Pick<EntitySchema, '_id' | 'sharedId' | 'language' | 'metadata' | 'title'>>[];
};

export class CreateBlankSuggestionStrategy {
  static getStrategy(extractor: IXExtractorType) {
    const isFromPdf = !!extractor.source.pdf;

    if (isFromPdf) {
      return new CreateBlankSuggestionsForPdf();
    }

    return new CreateBlankSuggestionsForProperty();
  }
}
