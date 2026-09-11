import { UseCase } from '#api/core/libs/UseCase.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { IXExtractorsDAOFactory } from '#api/services/informationextraction/infrastructure/IXExtractorsDAOFactory.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { Extractor } from '#api/services/informationextraction/domain/IXExtractorsDataSource.js';
import { IXSuggestionsDAOFactory } from '../infrastructure/IXSuggestionsDAOFactory.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import { SuggestionFactory } from '../suggestionFactory.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

// Temporary union type during Mongo -> Postgres migration
type TemplatesDAO = Awaited<ReturnType<typeof TemplatesDAOFactory.default>>;

type Input = {
  entities: EntitySchema[];
  /**
   * The same entities as they were before the update, so a source-property change can be told
   * apart from any other edit. Optional only so a caller that genuinely cannot know the previous
   * state degrades to refreshing entity data without invalidating anything.
   */
  previousEntities?: EntitySchema[];
};

type Output = void;

class UpdateSuggestionsAfterEntityUpdate implements UseCase<Input, Output> {
  private templatesDAO: TemplatesDAO;

  constructor(templatesDAO: TemplatesDAO) {
    this.templatesDAO = templatesDAO;
  }

  /**
   * A suggestion's `suggestedValue` and `segment` were extracted from the entity's source text.
   * Once that text changes they describe something the entity no longer says, so the row is stale
   * and has to be marked obsolete: the review table then shows it as such, and the next run
   * re-extracts it (obsolete rows are in the default process filters).
   *
   * A pdf-source extractor never matches here — `extractSourceText` is empty for those, so before
   * and after compare equal. Their invalidation belongs to the file listener.
   */
  private static sourceChanged({
    suggestion,
    extractor,
    entity,
    previousEntities,
  }: {
    suggestion: Suggestion;
    extractor: Extractor;
    entity: EntitySchema;
    previousEntities?: EntitySchema[];
  }): boolean {
    const previousEntity = previousEntities?.find(
      e => e.language === suggestion.language && e.sharedId === suggestion.entityId
    );

    if (!previousEntity) return false;

    return (
      IXServices.extractSourceText({ entity, extractor }) !==
      IXServices.extractSourceText({ entity: previousEntity, extractor })
    );
  }

  /**
   * This used to be an aggregation that `$lookup`ed the extractor onto every suggestion and
   * `$unwind`ed it away again. The join carried no store-specific logic — it is a foreign key
   * and there are only ever a handful of extractors — so it is two named reads instead of a
   * pipeline the Postgres implementation would have had to reproduce. `$unwind` dropped
   * suggestions whose extractor no longer exists; the `if (!extractor)` below is that rule,
   * written down.
   */
  async execute({ entities, previousEntities }: Input): Promise<void> {
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

      const updated = SuggestionFactory.updateEntityData({
        suggestion,
        targetProperty,

        update: {
          entityTitle: entity?.title,
          currentValue: IXServices.extractCurrentValue({ entity, targetProperty }),
        },
      });

      updatedSuggestions.push(
        UpdateSuggestionsAfterEntityUpdate.sourceChanged({
          suggestion,
          extractor,
          entity,
          previousEntities,
        })
          ? SuggestionFactory.markAsObsolete({ suggestion: updated, targetProperty })
          : updated
      );
    });

    await IXSuggestionsDAOFactory.default().saveMultiple(updatedSuggestions);
  }
}

export type { Input };
export { UpdateSuggestionsAfterEntityUpdate };
