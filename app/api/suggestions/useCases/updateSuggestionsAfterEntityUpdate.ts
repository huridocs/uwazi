import { UseCase } from '#api/core/libs/UseCase.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { IXExtractorsDAOFactory } from '#api/services/informationextraction/infrastructure/IXExtractorsDAOFactory.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { IXSuggestionsDAOFactory } from '../infrastructure/IXSuggestionsDAOFactory.js';
import { SuggestionFactory } from '../suggestionFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

// Temporary union type during Mongo -> Postgres migration
type TemplatesDAO = Awaited<ReturnType<typeof TemplatesDAOFactory.default>>;

type Input = {
  entities: EntitySchema[];
};

type Output = void;

class UpdateSuggestionsAfterEntityUpdate implements UseCase<Input, Output> {
  private templatesDAO: TemplatesDAO;

  constructor(templatesDAO: TemplatesDAO) {
    this.templatesDAO = templatesDAO;
  }

  /**
   * This used to be an aggregation that `$lookup`ed the extractor onto every suggestion and
   * `$unwind`ed it away again. The join carried no store-specific logic — it is a foreign key
   * and there are only ever a handful of extractors — so it is two named reads instead of a
   * pipeline the Postgres implementation would have had to reproduce. `$unwind` dropped
   * suggestions whose extractor no longer exists; the `if (!extractor)` below is that rule,
   * written down.
   */
  async execute({ entities }: Input): Promise<void> {
    // Every entity reaching this listener has been persisted, so it carries a sharedId.
    const suggestions = await IXSuggestionsDAOFactory.default().getByEntityId(
      entities[0].sharedId!
    );

    const extractorsById = objectIndex(
      await IXExtractorsDAOFactory.default().getByIds([
        ...new Set(suggestions.map(s => s.extractorId.toString())),
      ]),
      extractor => extractor._id.toString(),
      extractor => extractor
    );

    const templateIds = [...new Set(suggestions.map(s => s.entityTemplate))];
    const templateDBOs = await this.templatesDAO.get(templateIds);
    const templateMap = new Map(templateDBOs.map(t => [t._id.toString(), t]));

    const updatedSuggestions: IXSuggestionType[] = [];

    suggestions.forEach(suggestion => {
      const extractor = extractorsById[suggestion.extractorId.toString()];
      if (!extractor) return;

      const template = templateMap.get(suggestion.entityTemplate);
      if (!template) return;
      const targetProperty = IXServices.extractTargetProperty(extractor, template as any);
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

    await IXSuggestionsDAOFactory.default().saveMultiple(updatedSuggestions);
  }
}

export type { Input };
export { UpdateSuggestionsAfterEntityUpdate };
