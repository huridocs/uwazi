// @ts-expect-error TS(2307): Cannot find module '../../shared/types/extractorTy... Remove this comment to see the full error message
import { IXExtractorType } from 'shared/types/extractorType.js';

import { PropertySchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
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
