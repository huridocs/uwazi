import { EnforcedWithId } from 'api/odm';
import templatesModel from 'api/templates/templatesModel';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { propertyIsMultiValued } from 'shared/getIXSuggestionState';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { IXModelType } from 'shared/types/IXModelType';
import { TemplateSchema } from 'shared/types/templateType';
import ixmodels, { DEFAULT_MAX_SUGGESTIONS_SIZE } from './ixmodels';

type GetTargetPropertyInput = {
  extractor: IXExtractorType;
};

type ExtractCurrentValueInput = {
  entity: Partial<EntitySchema>;
  targetProperty: PropertySchema;
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
    const template = await templatesModel.getById(extractor.templates[0]);
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
    const allPossibleSuggestions = await IXSuggestionsModel.count({ extractorId });
    const maxCap = model.maxSuggestionsToFind ?? DEFAULT_MAX_SUGGESTIONS_SIZE;
    const totalSuggestions = Math.min(maxCap, allPossibleSuggestions);
    return totalSuggestions;
  }

  static async computeTotalSuggestionsForProcess(
    extractorId: ObjectIdSchema,
    model: EnforcedWithId<IXModelType>,
    filters?: { nonProcessed?: boolean; obsolete?: boolean; error?: boolean }
  ) {
    const statuses = {
      nonProcessed: filters?.nonProcessed ?? false,
      obsolete: filters?.obsolete ?? false,
      error: filters?.error ?? false,
    };

    const usingAnyFilter = statuses.nonProcessed || statuses.obsolete || statuses.error;

    // Default to all three statuses if no explicit filter selection
    const matchAny = usingAnyFilter
      ? [
          statuses.nonProcessed ? { date: null } : null,
          statuses.obsolete ? { date: { $ne: null }, 'state.obsolete': true } : null,
          statuses.error ? { date: { $ne: null }, 'state.error': true } : null,
        ].filter(Boolean)
      : [
          { date: null },
          { date: { $ne: null }, 'state.obsolete': true },
          { date: { $ne: null }, 'state.error': true },
        ];

    const count = await IXSuggestionsModel.db.countDocuments({
      extractorId,
      $or: matchAny as any[],
    });

    const maxCap = model.maxSuggestionsToFind ?? DEFAULT_MAX_SUGGESTIONS_SIZE;
    const total = Math.min(maxCap, count);
    return total;
  }

  static async saveModelProcess(
    extractorId: ObjectIdSchema,
    status: ModelStatus = ModelStatus.processing,
    { findingSuggestions = true, computeTotalSuggestions = false }: SaveModelProcessOptions = {}
  ) {
    const [model] = await ixmodels.get({ extractorId });

    const newModel = {
      ...model,
      status,
      creationDate: new Date().getTime(),
      extractorId,
      findingSuggestions,
    };

    if (computeTotalSuggestions) {
      const totalSuggestions = await this.computeTotalSuggestionsToFind(extractorId, model);
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

  static extractLabeledValueFromFile({ file, targetProperty }: ExtractLabelTextForPDFInput) {
    return (
      file.extractedMetadata?.find(m => m.name === targetProperty.name)?.selection?.text || null
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
