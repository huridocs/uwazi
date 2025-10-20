import { UseCase } from 'api/core/libs/UseCase';
import { LanguageUtils } from 'shared/language';
import { files } from 'api/files';
import { IXSuggestionType } from 'shared/types/suggestionType';
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
