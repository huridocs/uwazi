import { UseCase } from '#api/core/libs/UseCase.js';
import { LanguageUtils } from '#shared/language/index.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { Suggestions } from '../suggestions.js';
import { CreateBlankSuggestionsInput } from './createBlankSuggestionStrategy.js';
import { SuggestionFactory } from '../suggestionFactory.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';

type Input = CreateBlankSuggestionsInput;

export class CreateBlankSuggestionsForPdf implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ entities, extractor, targetProperty }: Input) {
    const filesForSuggestions = await FilesDAOFactory.default().getByQuery(
      {
        entity: { $in: entities.map(e => e.sharedId) },
        language: { $in: entities.map(e => LanguageUtils.fromISO639_1(e.language)?.ISO639_3) },
        type: 'document',
      },
      { projection: { _id: 1, entity: 1, language: 1, propertySelections: 1 } }
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
