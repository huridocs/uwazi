import { propertyTypeIsMultiValued } from 'api/services/informationextraction/ixMaterials';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { getSuggestionState } from 'shared/getIXSuggestionState';
import { LanguageUtils } from 'shared/language';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXExtractorType } from 'shared/types/extractorType';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionStateType, IXSuggestionType } from 'shared/types/suggestionType';
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

type UpdateEntityDataInput = {
  suggestion: IXSuggestionType;
  targetProperty: PropertySchema;
  update: Pick<IXSuggestionType, 'entityTitle' | 'currentValue'>;
};

type MarkAsObsoleteInput = {
  suggestion: IXSuggestionType;
  targetProperty: PropertySchema;
};

type AcceptSuggestionInput = {
  suggestion: IXSuggestionType;
  targetProperty: PropertySchema;
};

type MarkAsProcessingInput = {
  suggestion: IXSuggestionType;
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

    const _suggestion: IXSuggestionType = {
      extractorId: extractor._id,
      entityId: entity.sharedId!,
      entityLanguageId: entity._id,
      fileId: file._id,
      entityTemplate: entity.template!.toString(),

      propertyName: extractor.property,
      language,
      suggestedValue: propertyTypeIsMultiValued(targetProperty.type) ? [] : '',
      date: null,
      status: 'ready' as any,
      error: '',
      segment: '',
      currentValue: IXServices.extractCurrentValue({ entity, targetProperty }),
      entityTitle: entity.title,
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  static createForProperty({
    entity,
    extractor,
    targetProperty,
  }: CreateForPropertyInput): IXSuggestionType {
    const _suggestion: IXSuggestionType = {
      extractorId: extractor._id,
      entityId: entity.sharedId!,
      entityLanguageId: entity._id,
      entityTemplate: entity.template!.toString(),

      language: entity.language!,
      propertyName: extractor.property,
      entityTitle: entity.title,
      currentValue: IXServices.extractCurrentValue({ entity, targetProperty }),
      suggestedValue: propertyTypeIsMultiValued(targetProperty.type) ? [] : '',
      date: null,
      status: 'ready',

      error: '',
      segment: '',
      trainingSample: false,
      suggestedText: '',
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  static updateEntityData({
    suggestion,
    targetProperty,
    update,
  }: UpdateEntityDataInput): IXSuggestionType {
    const _suggestion: IXSuggestionType = {
      ...suggestion,
      ...update,
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  static markAsObsolete({ suggestion, targetProperty }: MarkAsObsoleteInput): IXSuggestionType {
    const _suggestion: IXSuggestionType = {
      ...suggestion,
      state: { ...suggestion.state!, obsolete: true },
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  static acceptSuggestion({ suggestion, targetProperty }: AcceptSuggestionInput): IXSuggestionType {
    const _suggestion: IXSuggestionType = {
      ...suggestion,
      currentValue: suggestion.suggestedValue,
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  static markAsProcessing({ suggestion, targetProperty }: MarkAsProcessingInput): IXSuggestionType {
    const _suggestion: IXSuggestionType = {
      ...suggestion,
      status: 'processing',
      date: Date.now(),
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  static markAsReady({ suggestion, targetProperty }: MarkAsProcessingInput): IXSuggestionType {
    const _suggestion: IXSuggestionType = {
      ...suggestion,
      status: 'ready',
      state: {
        ...suggestion.state!,
        obsolete: false,
      },
    };

    _suggestion.state = SuggestionFactory.updateSuggestionState(_suggestion, targetProperty);

    return _suggestion;
  }

  private static updateSuggestionState(
    suggestion: IXSuggestionType,
    targetProperty: PropertySchema
  ): IXSuggestionStateType {
    return getSuggestionState(
      {
        currentValue: suggestion.currentValue!,
        date: suggestion.date!,
        error: suggestion.error!,
        segment: suggestion.segment!,
        status: suggestion.status!,
        suggestedValue: suggestion.suggestedValue!,
        obsolete: !!suggestion?.state?.obsolete,
      },
      targetProperty.type
    );
  }
}
