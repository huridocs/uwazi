import { propertyTypeIsMultiValued } from 'api/services/informationextraction/getFiles';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { getSuggestionState } from 'shared/getIXSuggestionState';
import { LanguageUtils } from 'shared/language';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { LanguageNotSupportedError } from './ixValidationError';

type CreateForPdfInput = {
  file: FileType;
  extractor: IXExtractorType;
  entity: EntitySchema;
  targetProperty: PropertySchema;
};

export class SuggestionFactory {
  static createForPdf({
    extractor,
    entity,
    file,
    targetProperty,
  }: CreateForPdfInput): IXSuggestionType {
    const language = LanguageUtils.fromISO639_3(file.language!, false)?.ISO639_1;
    if (!language) {
      throw new LanguageNotSupportedError(file.language!);
    }

    const _suggestion = {
      extractorId: extractor._id,
      entityId: entity.sharedId!,
      fileId: file._id,
      entityTemplate: entity.template!.toString(),

      propertyName: extractor.property,
      language,
      suggestedValue: propertyTypeIsMultiValued(targetProperty.type) ? [] : '',
      date: new Date().getTime(),
      status: 'ready' as any,
      error: '',
      segment: '',
    };

    const state = getSuggestionState(
      {
        date: _suggestion.date,
        error: _suggestion.error,
        status: _suggestion.status,
        segment: _suggestion.segment,
        suggestedValue: _suggestion.suggestedValue,
        currentValue: IXServices.extractCurrentValue({
          entity,
          targetProperty,
        }),
        labeledValue: IXServices.extractLabeledValueFromFile({ file, targetProperty }),
        modelCreationDate: undefined as any,
        state: undefined as any,
      },
      targetProperty.type
    );

    return {
      ..._suggestion,
      state,
    };
  }
}
