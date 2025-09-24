// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../services/informationextract... Remove this comment to see the full error message
import { IXServices } from '../services/informationextraction/IXServices.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/suggestionT... Remove this comment to see the full error message
import { IXSuggestionType } from 'shared/types/suggestionType.js';
import { PipelineBuilder } from '../queryBuilder';
import { IXSuggestionsModel } from '../IXSuggestionsModel';
import { SuggestionFactory } from '../suggestionFactory';

type Input = {
  entities: EntitySchema[];
};

type Output = void;

class UpdateSuggestionsAfterEntityUpdate implements UseCase<Input, Output> {
  private pipeline: PipelineBuilder;

  constructor() {
    this.pipeline = new PipelineBuilder();
  }

  async execute({ entities }: Input): Promise<void> {
    this.pipeline.add({ $match: { entityId: entities[0].sharedId } });

    this.pipeline.add({
      $lookup: {
        from: 'ixextractors',
        as: 'extractor',
        localField: 'extractorId',
        foreignField: '_id',
      },
    });

    this.pipeline.add({
      $unwind: '$extractor',
    });

    this.pipeline.add({
      $lookup: {
        from: 'templates',
        as: 'template',
        let: {
          templateIdStr: '$entityTemplate',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $toObjectId: '$$templateIdStr' }],
              },
            },
          },
        ],
      },
    });

    this.pipeline.add({
      $unwind: '$template',
    });

    const suggestions = await IXSuggestionsModel.db.aggregate(this.pipeline.build());

    const updatedSuggestions: IXSuggestionType[] = [];

    suggestions.forEach(_suggestion => {
      const { template, extractor, ...suggestion } = _suggestion;
      const targetProperty = IXServices.extractTargetProperty(extractor, template);
      const entity = entities.find(
        e => e.language === suggestion.language && e.sharedId === suggestion.entityId
      );

      if (!entity) {
        return;
      }

      updatedSuggestions.push(
        SuggestionFactory.updateEntityData({
          suggestion,
          targetProperty,

          update: {
            entityTitle: entity?.title,
            currentValue: IXServices.extractCurrentValue({ entity, targetProperty }),
          },
        })
      );
    });

    await IXSuggestionsModel.saveMultiple(updatedSuggestions);
  }
}

export type { Input };
export { UpdateSuggestionsAfterEntityUpdate };
