import { UseCase } from 'api/common.v2/contracts/UseCase';
import { getSuggestionState } from 'shared/getIXSuggestionState';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { Suggestions } from '../suggestions';
import { CreateBlankSuggestionsInput } from './createBlankSuggestionStrategy';

type Input = CreateBlankSuggestionsInput;

export class CreateBlankSuggestionsForProperty implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ extractor, templateId, entities, isMultiValued, targetProperty }: Input) {
    const suggestions = entities.map(entity => {
      const blank = {
        language: entity.language,
        entityId: entity.sharedId,
        entityTemplate: templateId,
        extractorId: extractor._id,
        propertyName: extractor.property,
        status: 'ready' as 'ready',
        error: '',
        segment: '',
        suggestedValue: isMultiValued ? [] : '',
        date: new Date().getTime(),
      };

      const currentValue = IXServices.extractCurrentValue({ entity, targetProperty });
      const labeledValue = IXServices.extractLabeledValueFromEntity({ entity, targetProperty });

      const state = getSuggestionState(
        {
          date: blank.date,
          error: blank.error,
          status: blank.status,
          suggestedValue: blank.suggestedValue,
          segment: blank.segment,
          currentValue,
          labeledValue,
          modelCreationDate: undefined as any,
          state: undefined as any,
        },
        targetProperty.type
      );

      return { ...blank, state };
    });

    await Suggestions.createMultiple(suggestions);
  }
}
