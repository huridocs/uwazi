// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/language/index.js... Remove this comment to see the full error message
import { LanguageUtils } from 'shared/language/index.js';
// @ts-expect-error TS(2307): Cannot find module '../files.js' or its correspond... Remove this comment to see the full error message
import { files } from '../files.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/suggestionT... Remove this comment to see the full error message
import { IXSuggestionType } from 'shared/types/suggestionType.js';
import { Suggestions } from '../suggestions';
import { CreateBlankSuggestionsInput } from './createBlankSuggestionStrategy';
import { SuggestionFactory } from '../suggestionFactory';

type Input = CreateBlankSuggestionsInput;

export class CreateBlankSuggestionsForPdf implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ entities, extractor, targetProperty }: Input) {
    const filesForSuggestions = await files.get(
      {
        entity: { $in: entities.map(e => e.sharedId) },
        language: { $in: entities.map(e => LanguageUtils.fromISO639_1(e.language)?.ISO639_3) },
        type: 'document',
      },
      { _id: 1, entity: 1, language: 1, extractedMetadata: 1 }
    );

    const suggestions: IXSuggestionType[] = [];

    entities.forEach(entity => {
      const file = filesForSuggestions.find(
        // @ts-expect-error TS(7006): Parameter 'f' implicitly has an 'any' type.
        f =>
          f.entity === entity.sharedId &&
          LanguageUtils.fromISO639_3(f.language!, false)?.ISO639_1 === entity.language
      );

      if (!file) {
        return;
      }

      suggestions.push(
        SuggestionFactory.createForPdf({
          file,
          entity,
          extractor,
          targetProperty,
        })
      );
    });

    await Suggestions.createMultiple(suggestions);
  }
}
