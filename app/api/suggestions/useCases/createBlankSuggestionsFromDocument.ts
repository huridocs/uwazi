// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/index.js' or its c... Remove this comment to see the full error message
import entities from '../entities/index.js';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import { Extractors } from '../services/informationextraction/ixextractors.js';
// @ts-expect-error TS(2307): Cannot find module '../settings/index.js' or its c... Remove this comment to see the full error message
import settings from '../settings/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { LanguageUtils } from 'shared/language/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/fileType.js... Remove this comment to see the full error message
import { FileType } from 'shared/types/fileType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/suggestionT... Remove this comment to see the full error message
import { IXSuggestionType } from 'shared/types/suggestionType.js';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import { IXServices } from '../services/informationextraction/IXServices.js';
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
      // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
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

    // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
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
