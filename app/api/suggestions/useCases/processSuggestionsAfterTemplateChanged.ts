import { ObjectId } from 'mongodb';

import { UseCase } from '#api/common.v2/contracts/UseCase.js';

import { EntitySchema } from '#shared/types/entityType.js';

import { Extractors } from '#api/services/informationextraction/ixextractors.js';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';

import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { Suggestions } from '#api/suggestions/suggestions.js';
import { CreateBlankSuggestionStrategy } from '#api/suggestions/useCases/createBlankSuggestionStrategy.js';

type Input = {
  oldTemplateId: ObjectId;
  newTemplateId: ObjectId;
  entities: EntitySchema[];
};

class ProcessSuggestionsAfterTemplateChanged implements UseCase<Input, void> {
  // eslint-disable-next-line class-methods-use-this
  async execute({ oldTemplateId, newTemplateId, entities }: Input): Promise<void> {
    await Suggestions.delete({
      entityId: entities[0].sharedId,
      entityTemplate: oldTemplateId.toString(),
    });

    const extractorsOfNewTemplate = await Extractors.get({ templates: { $in: [newTemplateId] } });

    if (!extractorsOfNewTemplate.length) return;

    await ArrayUtils.sequentialFor(extractorsOfNewTemplate, async extractor => {
      const strategy = CreateBlankSuggestionStrategy.getStrategy(extractor);
      const targetProperty = await IXServices.getTargetProperty({ extractor });

      return strategy.execute({
        extractor,
        entities: entities as Required<EntitySchema>[],
        targetProperty,
      });
    });
  }
}

export type { Input };
export { ProcessSuggestionsAfterTemplateChanged };
