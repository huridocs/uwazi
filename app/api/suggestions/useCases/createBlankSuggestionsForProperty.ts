import { UseCase } from 'api/core/libs/UseCase';
import { Suggestions } from '../suggestions';
import { CreateBlankSuggestionsInput } from './createBlankSuggestionStrategy';
import { SuggestionFactory } from '../suggestionFactory';

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
