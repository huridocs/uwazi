import { propertyTypeIsMultiValued } from 'api/services/informationextraction/ixMaterials';
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

type CreateForPropertyInput = {
  entity: EntitySchema;
  extractor: IXExtractorType;
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

    const suggestion = {
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
      currentValue: IXServices.extractCurrentValue({ entity, targetProperty }),
      entityTitle: entity.title,
    };

    const state = getSuggestionState(
      {
        currentValue: suggestion.currentValue!,
        date: suggestion.date!,
        error: suggestion.error!,
        segment: suggestion.segment!,
        status: suggestion.status!,
        suggestedValue: suggestion.suggestedValue!,

        state: undefined as any,
        modelCreationDate: undefined as any,
      },
      targetProperty.type
    );

    return {
      ...suggestion,
      state,
    };
  }

  static createForProperty({
    entity,
    extractor,
    targetProperty,
  }: CreateForPropertyInput): IXSuggestionType {
    const suggestion: IXSuggestionType = {
      extractorId: extractor._id,
      entityId: entity.sharedId!,
      entityTemplate: entity.template!.toString(),

      language: entity.language!,
      propertyName: extractor.property,
      entityTitle: entity.title,
      currentValue: IXServices.extractCurrentValue({ entity, targetProperty }),
      suggestedValue: propertyTypeIsMultiValued(targetProperty.type) ? [] : '',
      date: Date.now(),
      status: 'ready',

      error: '',
      segment: '',
      trainingSample: false,
      suggestedText: '',
    };

    const state = getSuggestionState(
      {
        currentValue: suggestion.currentValue!,
        date: suggestion.date!,
        error: suggestion.error!,
        segment: suggestion.segment!,
        status: suggestion.status!,
        suggestedValue: suggestion.suggestedValue!,

        state: undefined as any,
        modelCreationDate: undefined as any,
      },
      targetProperty.type
    );

    return { ...suggestion, state };
  }
}
