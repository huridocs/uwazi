import { EnforcedWithId } from '#api/odm/index.js';
import templates from '#api/core/v1_layer/templates/templates.js';
import { ObjectIdSchema, PropertySchema } from '#shared/types/commonTypes.js';
import { IXExtractorType } from '#shared/types/extractorType.js';
import { ModelStatus } from '#shared/types/IXModelSchema.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { FileType } from '#shared/types/fileType.js';
import { propertyIsMultiValued } from '#shared/getIXSuggestionState.js';
import { IXSuggestionsDAOFactory } from '#api/suggestions/infrastructure/IXSuggestionsDAOFactory.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import ixmodels, { DEFAULT_MAX_SUGGESTIONS_SIZE } from './ixmodels.js';

const suggestionsDao = () => IXSuggestionsDAOFactory.default();

type GetTargetPropertyInput = {
  extractor: IXExtractorType;
};

type ExtractCurrentValueInput = {
  entity: Partial<EntitySchema>;
  targetProperty: PropertySchema;
};

type ExtractSourceTextInput = {
  entity: Partial<EntitySchema>;
  extractor: IXExtractorType;
};

type ExtractLabelTextForPDFInput = {
  file: FileType;
  targetProperty: PropertySchema;
};

type ExtractLabeledValueFromEntityInput = {
  entity: Partial<EntitySchema>;
  targetProperty: PropertySchema;
};

type SaveModelProcessOptions = {
  findingSuggestions?: boolean;
  computeTotalSuggestions?: boolean;
};

export class IXServices {
  static async getTargetProperty({ extractor }: GetTargetPropertyInput) {
    const template = await templates.getById(extractor.templates[0]);
    const property =
      extractor.property === 'title'
        ? template?.commonProperties?.find(p => p.name === extractor.property)
        : template?.properties?.find(p => p.name === extractor.property);

    return property!;
  }

  static extractTargetProperty(extractor: IXExtractorType, template: TemplateSchema) {
    const property =
      extractor.property === 'title'
        ? template?.commonProperties?.find(p => p.name === extractor.property)
        : template?.properties?.find(p => p.name === extractor.property);

    return property!;
  }

  static async computeTotalSuggestionsToFind(
    extractorId: ObjectIdSchema,
    model: EnforcedWithId<IXModelType>
  ) {
    const allPossibleSuggestions = await suggestionsDao().countAllForExtractor(extractorId);
    const maxCap = model.maxSuggestionsToFind ?? DEFAULT_MAX_SUGGESTIONS_SIZE;
    const totalSuggestions = Math.min(maxCap, allPossibleSuggestions);
    return totalSuggestions;
  }

  static async computeTotalSuggestionsForProcess(
    extractorId: ObjectIdSchema,
    model: EnforcedWithId<IXModelType>,
    filters?: { nonProcessed?: boolean; obsolete?: boolean; error?: boolean }
  ) {
    // An empty filter means all three statuses; the DAO owns that rule now.
    const count = await suggestionsDao().countPendingForExtractor(extractorId, filters);

    const maxCap = model.maxSuggestionsToFind ?? DEFAULT_MAX_SUGGESTIONS_SIZE;
    const total = Math.min(maxCap, count);
    return total;
  }

  static async saveModelProcess(
    extractorId: ObjectIdSchema,
    status: ModelStatus = ModelStatus.processing,
    { findingSuggestions = true, computeTotalSuggestions = false }: SaveModelProcessOptions = {}
  ) {
    const model = await ixmodels.getByExtractorId(extractorId);

    const newModel = {
      ...model,
      status,
      creationDate: new Date().getTime(),
      extractorId,
      findingSuggestions,
    };

    if (computeTotalSuggestions) {
      const totalSuggestions = await this.computeTotalSuggestionsToFind(extractorId, model!);
      newModel.totalSuggestionsToFind = totalSuggestions;
    }

    await ixmodels.saveAndObsoleteSuggestions(newModel);
  }

  static extractCurrentValue({ entity, targetProperty }: ExtractCurrentValueInput) {
    const isMultiValued = propertyIsMultiValued(targetProperty.type);

    if (targetProperty.name === 'title') {
      return entity.title!;
    }

    const values = entity.metadata?.[targetProperty.name]?.map(i => i.value);
    if (!values?.length) {
      return isMultiValued ? [] : '';
    }

    return isMultiValued ? values : values[0];
  }

  /**
   * The text a property-source extractor actually reads from an entity — the single definition of
   * it, so that whatever decides a suggestion is stale cannot drift from what produced it. Empty
   * for a pdf-source extractor, which reads files rather than metadata.
   */
  static extractSourceText({ entity, extractor }: ExtractSourceTextInput): string {
    if (!extractor.source.property) {
      return '';
    }

    if (extractor.source.property === 'title') {
      return entity.title || '';
    }

    return (entity.metadata?.[extractor.source.property]?.[0]?.value as string) || '';
  }

  static extractLabeledValueFromFile({ file, targetProperty }: ExtractLabelTextForPDFInput) {
    return (
      file.propertySelections?.find(m => m.name === targetProperty.name)?.selection?.text || null
    );
  }

  static extractLabeledValueFromEntity({
    entity,
    targetProperty,
  }: ExtractLabeledValueFromEntityInput) {
    if (targetProperty.name === 'title') {
      return entity.title as string;
    }

    const value = entity?.metadata?.[targetProperty.name]?.[0]?.value;

    return value ? String(value) : null;
  }
}
