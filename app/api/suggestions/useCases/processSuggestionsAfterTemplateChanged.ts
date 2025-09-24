import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import { Extractors } from '../services/informationextraction/ixextractors.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Array.js' o... Remove this comment to see the full error message
import { ArrayUtils } from '../common.v2/utils/Array.js';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import { IXServices } from '../services/informationextraction/IXServices.js';
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

    // @ts-expect-error TS(7006): Parameter 'extractor' implicitly has an 'any' type... Remove this comment to see the full error message
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
