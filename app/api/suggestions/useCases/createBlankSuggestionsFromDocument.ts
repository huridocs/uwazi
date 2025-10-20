import { UseCase } from 'api/core/libs/UseCase';
import entities from 'api/entities';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import settings from 'api/settings';
import { LanguageUtils } from 'shared/language';
import { FileType } from 'shared/types/fileType';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { SuggestionFactory } from '../suggestionFactory';
import { Suggestions } from '../suggestions';
import {
  ExtractorsNotAvailableError,
  FileTypeNotSupportedError,
  LanguageNotSupportedError,
} from '../ixValidationError';

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
