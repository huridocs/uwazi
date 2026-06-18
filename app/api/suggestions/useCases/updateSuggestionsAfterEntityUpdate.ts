import { UseCase } from '#api/core/libs/UseCase.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { PipelineBuilder } from '../queryBuilder.js';
import { IXSuggestionsModel } from '../IXSuggestionsModel.js';
import { SuggestionFactory } from '../suggestionFactory.js';

type Input = {
  entities: EntitySchema[];
};

type Output = void;

class UpdateSuggestionsAfterEntityUpdate implements UseCase<Input, Output> {
  private pipeline: PipelineBuilder;

  private templatesDAO: MongoTemplatesDAO;

  constructor(templatesDAO: MongoTemplatesDAO) {
    this.pipeline = new PipelineBuilder();
    this.templatesDAO = templatesDAO;
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

    const suggestions = await IXSuggestionsModel.db.aggregate(this.pipeline.build());

    const templateIds = [...new Set(suggestions.map((s: any) => s.entityTemplate))];
    const templateDBOs = await this.templatesDAO.get(templateIds);
    const templateMap = new Map(templateDBOs.map(t => [t._id.toHexString(), t]));

    const updatedSuggestions: IXSuggestionType[] = [];

    suggestions.forEach(_suggestion => {
      const { extractor, entityTemplate, ...suggestion } = _suggestion;
      const template = templateMap.get(entityTemplate);
      if (!template) return;
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
