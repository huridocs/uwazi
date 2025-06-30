import { UseCase } from 'api/common.v2/contracts/UseCase';
import { LanguageUtils } from 'shared/language';
import { files } from 'api/files';
import { getSuggestionState } from 'shared/getIXSuggestionState';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { Suggestions } from '../suggestions';
import { CreateBlankSuggestionsInput } from './createBlankSuggestionStrategy';

type Input = CreateBlankSuggestionsInput;

export class CreateBlankSuggestionsForPdf implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ entities, extractor, templateId, isMultiValued, targetProperty }: Input) {
    const filesForSuggestions = await files.get(
      {
        entity: { $in: entities.map(entity => entity.sharedId) },
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

      const _suggestion = {
        extractorId: extractor._id,
        entityId: entity.sharedId!,
        fileId: file._id,
        entityTemplate: templateId,

        propertyName: extractor.property,
        language: entity.language!,
        suggestedValue: isMultiValued ? [] : '',
        status: 'ready' as any,
        error: '',
        segment: '',
        date: new Date().getTime(),
      };

      suggestions.push({
        ..._suggestion,
        state: getSuggestionState(
          {
            date: _suggestion.date,
            error: _suggestion.error,
            status: _suggestion.status,
            segment: _suggestion.segment,
            suggestedValue: _suggestion.suggestedValue,
            currentValue: IXServices.extractCurrentValue({
              entity,
              targetProperty,
            }),
            labeledValue: IXServices.extractLabeledValueFromFile({ file, targetProperty }),
            modelCreationDate: undefined as any,
            state: undefined as any,
          },
          targetProperty.type
        ),
      });
    });

    await Suggestions.createMultiple(suggestions);
  }
}
