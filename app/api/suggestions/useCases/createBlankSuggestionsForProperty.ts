import { UseCase } from '#api/core/libs/UseCase.js';
import { Suggestions } from '#api/suggestions/suggestions.js';
import { CreateBlankSuggestionsInput } from '#api/suggestions/useCases/createBlankSuggestionStrategy.js';
import { SuggestionFactory } from '#api/suggestions/suggestionFactory.js';

type Input = CreateBlankSuggestionsInput;

export class CreateBlankSuggestionsForProperty implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ extractor, entities, targetProperty }: Input) {
    const suggestions = entities.map(entity =>
      SuggestionFactory.createForProperty({ entity, extractor, targetProperty })
    );
    await Suggestions.createMultiple(suggestions);
  }
}
