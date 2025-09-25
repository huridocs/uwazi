
import { IXExtractorType } from 'shared/types/extractorType.js';

import { PropertySchema } from 'shared/types/commonTypes.js';

import { EntitySchema } from 'shared/types/entityType.js';
import { CreateBlankSuggestionsForPdf } from './createBlankSuggestionsForPdf';
import { CreateBlankSuggestionsForProperty } from './createBlankSuggestionsForProperty';

export type CreateBlankSuggestionsInput = {
  extractor: IXExtractorType;
  targetProperty: PropertySchema;
  entities: Required<
    Pick<EntitySchema, '_id' | 'sharedId' | 'language' | 'metadata' | 'title' | 'template'>
  >[];
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
