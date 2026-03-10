import { ObjectId } from 'mongodb';

import { UseCase } from 'api/core/libs/UseCase';
import { EntitySchema } from 'shared/types/entityType';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { IXServices } from 'api/services/informationextraction/IXServices';
import { Suggestions } from '../suggestions';
import { CreateBlankSuggestionStrategy } from './createBlankSuggestionStrategy';

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
