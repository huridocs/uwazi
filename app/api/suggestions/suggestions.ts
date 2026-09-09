/* eslint-disable no-continue */
/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

import { EnforcedWithId } from '#api/odm/index.js';
import { IXSuggestionsDAOFactory } from './infrastructure/IXSuggestionsDAOFactory.js';
import { IXSuggestionsStatsQueryServiceFactory } from './infrastructure/IXSuggestionsStatsQueryServiceFactory.js';
import { IXSuggestionsSampleQueryServiceFactory } from './infrastructure/IXSuggestionsSampleQueryServiceFactory.js';
import { balancedSampleSizes } from './domain/balancedSampleSizes.js';
import { PendingStatusFilter } from './domain/IXSuggestionsDataSource.js';
import { SuggestionStats } from './domain/IXSuggestionsStatsQueryService.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { ObjectIdSchema, PropertySchema } from '#shared/types/commonTypes.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { propertyTypeIsWithoutPropertySelections } from '#api/services/informationextraction/ixMaterials.js';
import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { registerEventListeners } from './eventListeners.js';
import { recomputeAllStates } from './updateState.js';
import {
  AcceptedSuggestion,
  SuggestionAcceptanceError,
  updateEntitiesWithSuggestion,
} from './updateEntities.js';

const updatePropertySelections = async (
  suggestions: IXSuggestionType[],
  property: PropertySchema
) => {
  if (propertyTypeIsWithoutPropertySelections(property.type)) return;

  const filesDS = FilesDataSourceFactory.default();
  const filesService = FilesServiceFactory.default();
  const transactionManager = TransactionManagerFactory.default();

  const suggestionFileIds = suggestions.map(s => s.fileId).filter(Boolean);
  if (!suggestionFileIds.length) return;

  const fetchedFiles = await filesDS.getByIds(suggestionFileIds as string[]);
  const filesById = objectIndex(
    fetchedFiles,
    f => f.id.toString() || '',
    f => f
  );

  const updatedFiles: BaseFile[] = [];

  for (const suggestion of suggestions) {
    const fileId = suggestion.fileId?.toString();
    if (!fileId) continue;

    const file = filesById[fileId];
    if (!file) continue;

    const updated = file.update({
      propertySelections: [
        {
          name: suggestion.propertyName,
          timestamp: Date(),
          selection: {
            text: suggestion.suggestedText || suggestion.suggestedValue?.toString(),
            selectionRectangles: suggestion.selectionRectangles,
          },
        },
      ],
    });

    if (updated.hasChanged) {
      updatedFiles.push(updated);
    }
  }

  if (updatedFiles.length > 0) {
    await transactionManager.run(async () => {
      await filesService.bulkUpsert(updatedFiles);
    });
  }
};

const dao = () => IXSuggestionsDAOFactory.default();

const propertyTypesWithAllLanguages = new Set(['numeric', 'date', 'select', 'multiselect']);

const needsAllLanguages = (propertyType: PropertySchema['type']) =>
  propertyTypesWithAllLanguages.has(propertyType);

const validTypesForPartialAcceptance = new Set(['multiselect', 'relationship']);

const typeIsValidForPartialAcceptance = (propertyType: string) =>
  validTypesForPartialAcceptance.has(propertyType);

const validatePartialAcceptanceTypeConstraint = (
  acceptedSuggestions: AcceptedSuggestion[],
  property: PropertySchema
) => {
  const addedValuesExist = acceptedSuggestions.some(s => s.addedValues);
  const removedValuesExist = acceptedSuggestions.some(s => s.removedValues);
  const partialAcceptanceTriggered = addedValuesExist || removedValuesExist;
  if (!typeIsValidForPartialAcceptance(property.type) && partialAcceptanceTriggered) {
    throw new SuggestionAcceptanceError(
      'Partial acceptance is only allowed for multiselects or relationships.'
    );
  }
};

const Suggestions = {
  /**
   * A process run's next batch: half already-labeled, half not, honouring the status filters the
   * model's process run stored. Split three ways in 4c-2 — the counts are a data source call, the
   * allocation is `balancedSampleSizes`, and only the random draw is store-specific.
   */
  getSampleForProcess: async (
    extractorId: ObjectIdSchema,
    model: EnforcedWithId<IXModelType>,
    maxTotal: number
  ): Promise<IXSuggestionType[]> => {
    const statusFilter: PendingStatusFilter = (model as any)?.processRun?.find?.filters || {};

    const available = await dao().countPendingByLabel(extractorId, statusFilter);
    const sizes = balancedSampleSizes({ ...available, maxTotal });

    return IXSuggestionsSampleQueryServiceFactory.default().sampleForProcess({
      extractorId,
      statusFilter,
      sizes,
    });
  },

  aggregate: async (extractorId: ObjectIdSchema): Promise<SuggestionStats> =>
    IXSuggestionsStatsQueryServiceFactory.default().getStatsForExtractor(extractorId),

  recomputeAllStates,

  setObsolete: async (extractorId: ObjectIdSchema) => dao().markObsoleteForExtractor(extractorId),

  markSuggestionsAsTrainingSamples: async (entities: string[], extractorIdString: string) => {
    const extractorId = ObjectId.createFromHexString(extractorIdString);
    await dao().clearTrainingSamplesForExtractor(extractorId);

    const chunks = ArrayUtils.splitInChunks(entities, 1000);
    await chunks.reduce(async (promise, chunk) => {
      await promise;
      await dao().markTrainingSamples(extractorId, chunk);
    }, Promise.resolve());
  },

  getAlreadySeenInFindRun: async (
    extractorId: ObjectIdSchema,
    candidateIds: string[],
    runTimestamp: number
  ): Promise<Set<string>> =>
    new Set(await dao().getEntityIdsSeenInRun(extractorId, candidateIds, runTimestamp)),

  save: async (suggestion: IXSuggestionType) => Suggestions.saveMultiple([suggestion]),

  saveMultiple: async (_suggestions: Partial<IXSuggestionType>[]) =>
    dao().saveMultiple(_suggestions),

  createMultiple: async (_suggestions: IXSuggestionType[]) => dao().createMultiple(_suggestions),

  accept: async (acceptedSuggestions: AcceptedSuggestion[]) => {
    const acceptedIds = Array.from(new Set(acceptedSuggestions.map(s => s._id.toString())));
    const suggestions = await dao().getByIds(acceptedIds);
    const extractors = new Set(suggestions.map(s => s.extractorId.toString()));
    if (extractors.size > 1) {
      throw new Error('All suggestions must come from the same extractor');
    }
    const foundIds = new Set(suggestions.map(s => s._id.toString()));
    if (!acceptedIds.every(id => foundIds.has(id))) {
      throw new Error('Suggestion(s) not found.');
    }
    if (suggestions.some(s => s.error !== '')) {
      throw new Error('Some Suggestions have an error.');
    }

    const { propertyName } = suggestions[0];
    const property = await templates.getPropertyByName(propertyName);
    validatePartialAcceptanceTypeConstraint(acceptedSuggestions, property);
    const allLanguage = needsAllLanguages(property.type);

    await updateEntitiesWithSuggestion(allLanguage, acceptedSuggestions, suggestions, property);
    await updatePropertySelections(suggestions, property);
  },

  deleteByEntityId: async (sharedId: string) => dao().deleteByEntityId(sharedId),
  deleteByEntityAndTemplate: async (sharedId: string, templateId: string) =>
    dao().deleteByEntityAndTemplate(sharedId, templateId),
  deleteByExtractorId: async (extractorId: ObjectIdSchema) =>
    dao().deleteByExtractorId(extractorId),
  deleteByExtractorIds: async (extractorIds: ObjectIdSchema[]) =>
    dao().deleteByExtractorIds(extractorIds),
  deleteByTemplatesAndExtractors: async (templateIds: string[], extractorIds: ObjectIdSchema[]) =>
    dao().deleteByTemplatesAndExtractors(templateIds, extractorIds),
  deleteByFileIds: async (fileIds: ObjectIdSchema[]) => dao().deleteByFileIds(fileIds),
  registerEventListeners,
};

export { Suggestions };
