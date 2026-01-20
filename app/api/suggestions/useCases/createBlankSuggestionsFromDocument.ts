import { UseCase } from '#api/common.v2/contracts/UseCase.js';

import entities from '#api/entities/entities.js';

import { Extractors } from '#api/services/informationextraction/ixextractors.js';

import settings from '#api/settings/settings.js';

import { LanguageUtils } from '#shared/language/index.js';

import { FileType } from '#shared/types/fileType.js';

import { IXSuggestionType } from '#shared/types/suggestionType.js';

import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { SuggestionFactory } from '#api/suggestions/suggestionFactory.js';
import { Suggestions } from '#api/suggestions/suggestions.js';
import {
  ExtractorsNotAvailableError,
  FileTypeNotSupportedError,
  LanguageNotSupportedError,
} from '#api/suggestions/ixValidationError.js';

type Input = {
  file: FileType;
};

export class CreateBlankSuggestionsFromDocument implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ file }: Input): Promise<void> {
    const isDocument = file.type === 'document';
    if (!isDocument) {
      throw new FileTypeNotSupportedError(file.type!);
    }

    const { languages } = await settings.get();
    const isLanguageSupported = languages?.some(
      l => l.key === LanguageUtils.fromISO639_3(file.language!).key
    );

    if (!isLanguageSupported) {
      throw new LanguageNotSupportedError(file.language!);
    }
    const [entity] = await entities.get(
      { sharedId: file.entity! },
      { template: 1, title: 1, metadata: 1 }
    );

    const extractors = await Extractors.get({
      templates: { $in: [entity.template] },
      'source.pdf': { $exists: true },
    });

    if (!extractors.length) {
      throw new ExtractorsNotAvailableError(entity.template);
    }

    const targetProperty = await IXServices.getTargetProperty({ extractor: extractors[0] });

    const suggestions: IXSuggestionType[] = [];

    extractors.forEach(e =>
      suggestions.push(
        SuggestionFactory.createForPdf({
          file,
          entity,
          extractor: e,
          targetProperty,
        })
      )
    );

    await Suggestions.createMultiple(suggestions);
  }
}
