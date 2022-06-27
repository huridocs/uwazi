import entities from 'api/entities/entities';
import entitiesModel from 'api/entities/entitiesModel';
import { files } from 'api/files/files';
import settings from 'api/settings/settings';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import languages from 'shared/languages';
import { ExtractedMetadataSchema, ObjectIdSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { IXSuggestionsFilter, IXSuggestionType } from 'shared/types/suggestionType';
import { registerEventListeners } from './eventListeners';
import {
  getCurrentValueStage,
  getEntityStage,
  getFileStage,
  getLabeledValueStage,
} from './pipelineStages';
import { updateStates } from './updateState';

interface ISettingsTemplate {
  template: string | ObjectIdSchema;
  properties: string[];
}

interface AcceptedSuggestion {
  _id: ObjectIdSchema;
  sharedId: string;
  entityId: string;
}

const updateEntitiesWithSuggestion = async (
  allLanguages: boolean,
  acceptedSuggestion: AcceptedSuggestion,
  suggestion: IXSuggestionType
) => {
  const query = allLanguages
    ? { sharedId: acceptedSuggestion.sharedId }
    : { sharedId: acceptedSuggestion.sharedId, _id: acceptedSuggestion.entityId };
  const storedEntities = await entities.get(query, '+permissions');
  const entitiesToUpdate =
    suggestion.propertyName !== 'title'
      ? storedEntities.map((entity: EntitySchema) => ({
          ...entity,
          metadata: {
            ...entity.metadata,
            [suggestion.propertyName]: [{ value: suggestion.suggestedValue }],
          },
          permissions: entity.permissions || [],
        }))
      : storedEntities.map((entity: EntitySchema) => ({
          ...entity,
          title: suggestion.suggestedValue,
        }));

  await entities.saveMultiple(entitiesToUpdate);
};

const updateExtractedMetadata = async (suggestion: IXSuggestionType) => {
  const fetchedFiles = await files.get({ _id: suggestion.fileId });

  if (!fetchedFiles?.length) return Promise.resolve();
  const file = fetchedFiles[0];

  file.extractedMetadata = file.extractedMetadata ? file.extractedMetadata : [];
  const extractedMetadata = file.extractedMetadata.find(
    (em: any) => em.name === suggestion.propertyName
  ) as ExtractedMetadataSchema;

  if (!extractedMetadata) {
    file.extractedMetadata.push({
      name: suggestion.propertyName,
      timestamp: Date(),
      selection: {
        text: suggestion.suggestedText || suggestion.suggestedValue?.toString(),
        selectionRectangles: suggestion.selectionRectangles,
      },
    });
  } else {
    extractedMetadata.timestamp = Date();
    extractedMetadata.selection = {
      text: suggestion.suggestedText || suggestion.suggestedValue?.toString(),
      selectionRectangles: suggestion.selectionRectangles,
    };
  }
  return files.save(file);
};

const deleteSuggestionsNotConfigured = async (
  currentSettingsTemplates: any[],
  settingsTemplates: any[]
) => {
  const deletedTemplates = currentSettingsTemplates.filter(
    set => !settingsTemplates.find((st: any) => st.template === set.template)
  );

  const deletedTemplateProps = currentSettingsTemplates
    .map(currentTemplate => {
      const currentTemplateId = currentTemplate.template;
      const property: any = {};
      const template = settingsTemplates.find((st: any) => st.template === currentTemplateId);
      if (template) {
        property.template = currentTemplateId;
        property.properties = [];
        currentTemplate.properties.forEach((prop: string) => {
          if (!template.properties.includes(prop)) {
            property.properties.push(prop);
          }
        });
      }
      return property;
    })
    .filter(prop => prop.template && prop.properties.length);

  const deletedTemplatesAndDeletedTemplateProps = deletedTemplates.concat(deletedTemplateProps);

  if (deletedTemplatesAndDeletedTemplateProps.length > 0) {
    const deletedTemplateIds = deletedTemplatesAndDeletedTemplateProps.map(temps => temps.template);

    const entitiesDoc = await entities.get({ template: { $in: deletedTemplateIds } }, 'sharedId');

    const entitiesSharedIds = entitiesDoc.map((entity: any) => entity.sharedId);
    const propNames: string[] = deletedTemplatesAndDeletedTemplateProps.reduce(
      (acc, curr) => [...acc, ...curr.properties],
      []
    );
    const uniquePropNames: string[] = [...new Set<string>(propNames)];

    await IXSuggestionsModel.db.deleteMany({
      $and: [{ entityId: { $in: entitiesSharedIds } }, { propertyName: { $in: uniquePropNames } }],
    });
  }
};

const getTemplatesWithNewProps = (
  settingsTemplates: ISettingsTemplate[],
  currentSettingsTemplates: ISettingsTemplate[]
) =>
  settingsTemplates
    .map(newTemp => {
      const oldTemplate = currentSettingsTemplates?.find(
        oldTemp => oldTemp.template === newTemp.template
      );
      if (newTemp.properties.length === oldTemplate?.properties.length || !oldTemplate) {
        return null;
      }
      const newProps = newTemp.properties;
      const oldProps = oldTemplate?.properties || [];
      const addedProps: string[] = newProps
        .map((prop: any) => (!oldProps.includes(prop) ? prop : false))
        .filter(p => p);
      return { ...newTemp, properties: addedProps };
    })
    .filter(t => t);

const getTemplateDifference = (
  currentSettingsTemplates: ISettingsTemplate[],
  settingsTemplates: ISettingsTemplate[]
) => {
  const newTemplates = settingsTemplates.filter(temp => {
    const oldTemplateIds = currentSettingsTemplates?.map(oldTemp => oldTemp.template) || [];
    return !oldTemplateIds.includes(temp.template);
  });

  const combedNewTemplates = getTemplatesWithNewProps(settingsTemplates, currentSettingsTemplates);

  return newTemplates.concat(combedNewTemplates as ISettingsTemplate[]);
};

const fetchEntitiesBatch = async (query: any, limit: number = 100) =>
  entitiesModel.db.find(query).select('sharedId').limit(limit).sort({ _id: 1 }).exec();

export const Suggestions = {
  getById: async (id: ObjectIdSchema) => IXSuggestionsModel.getById(id),
  getByEntityId: async (sharedId: string) => IXSuggestionsModel.get({ entityId: sharedId }),

  get: async (filter: IXSuggestionsFilter, options: { page: { size: number; number: number } }) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { languages: setLanguages } = await settings.get();

    const { language, ...filters } = filter;

    const count = await IXSuggestionsModel.db
      .aggregate([{ $match: { ...filters, status: { $ne: 'processing' } } }, { $count: 'count' }])
      .then(result => (result?.length ? result[0].count : 0));

    const suggestions = await IXSuggestionsModel.db.aggregate([
      { $match: { ...filters, status: { $ne: 'processing' } } },
      { $sort: { date: 1, state: -1 } },
      { $skip: offset },
      { $limit: limit },
      ...getEntityStage(setLanguages!),
      ...getCurrentValueStage(),
      ...getFileStage(),
      ...getLabeledValueStage(),
      {
        $project: {
          entityId: '$entity._id',
          sharedId: '$entity.sharedId',
          entityTitle: '$entity.title',
          fileId: 1,
          language: 1,
          propertyName: 1,
          suggestedValue: 1,
          segment: 1,
          currentValue: 1,
          state: 1,
          page: 1,
          date: 1,
          labeledValue: 1,
        },
      },
    ]);

    const totalPages = Math.ceil(count / limit);
    return { suggestions, totalPages };
  },

  updateStates,

  setObsolete: async (query: any) =>
    IXSuggestionsModel.updateMany(query, { $set: { state: SuggestionState.obsolete } }),

  save: async (suggestion: IXSuggestionType) => Suggestions.saveMultiple([suggestion]),

  saveMultiple: async (_suggestions: IXSuggestionType[]) => {
    const toSave: IXSuggestionType[] = [];
    const update: IXSuggestionType[] = [];
    _suggestions.forEach(s => {
      if (s.status === 'failed') {
        toSave.push({ ...s, state: SuggestionState.error });
      } else if (s.status === 'processing') {
        toSave.push({ ...s, state: SuggestionState.processing });
      } else {
        toSave.push(s);
        update.push(s);
      }
    });
    await IXSuggestionsModel.saveMultiple(toSave);
    if (update.length > 0) await updateStates({ _id: { $in: update.map(s => s._id) } });
  },

  accept: async (acceptedSuggestion: AcceptedSuggestion, allLanguages: boolean) => {
    const suggestion = await IXSuggestionsModel.getById(acceptedSuggestion._id);
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }
    if (suggestion.error !== '') {
      throw new Error('Suggestion has an error');
    }
    await updateEntitiesWithSuggestion(allLanguages, acceptedSuggestion, suggestion);
    await updateExtractedMetadata(suggestion);
    await Suggestions.updateStates({ _id: acceptedSuggestion._id });
  },

  deleteByEntityId: async (sharedId: string) => {
    await IXSuggestionsModel.delete({ entityId: sharedId });
  },

  deleteByProperty: async (propertyName: string, templateId: string) => {
    const cursor = IXSuggestionsModel.db.find({ propertyName }).cursor();

    // eslint-disable-next-line no-await-in-loop
    for (let suggestion = await cursor.next(); suggestion; suggestion = await cursor.next()) {
      const sharedId = suggestion.entityId;
      // eslint-disable-next-line no-await-in-loop
      const [entity] = await entities.getUnrestricted({ sharedId });
      if (entity && entity.template?.toString() === templateId) {
        // eslint-disable-next-line no-await-in-loop
        await IXSuggestionsModel.delete({ _id: suggestion._id });
      }
    }
  },
  delete: IXSuggestionsModel.delete.bind(IXSuggestionsModel),
  registerEventListeners,
  saveConfigurations: async (settingsTemplates: ISettingsTemplate[]) => {
    const currentSettings = await settings.get();
    const defaultLanguage = currentSettings?.languages?.find(lang => lang.default)?.key;
    let currentSettingsTemplates: ISettingsTemplate[] | undefined =
      currentSettings.features?.metadataExtraction?.templates;
    currentSettingsTemplates = currentSettingsTemplates || [];

    await deleteSuggestionsNotConfigured(currentSettingsTemplates, settingsTemplates);
    // @ts-ignore
    currentSettings.features.metadataExtraction.templates = settingsTemplates;
    await settings.save(currentSettings);

    const newTemplates = getTemplateDifference(currentSettingsTemplates, settingsTemplates);
    await Suggestions.createBlankState(newTemplates, defaultLanguage as string);

    return currentSettings;
  },

  createBlankState: async (settingsTemplates: any[], defaultLanguage: string) => {
    const templatesPromises = settingsTemplates.map(
      async (template: { template: string; properties: string[] }) => {
        const BATCH_SIZE = 2000;
        let query: any = {
          template: template.template,
          language: defaultLanguage,
        };

        const entitiesSharedIds: string[] = [];

        let fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
        while (fetchedEntities.length) {
          const sharedIds = fetchedEntities.map(entity => entity.sharedId);
          entitiesSharedIds.push(...(sharedIds as string[]));
          query = {
            ...query,
            _id: { $gt: fetchedEntities[fetchedEntities.length - 1]._id },
          };
          // eslint-disable-next-line no-await-in-loop
          fetchedEntities = await fetchEntitiesBatch(query, BATCH_SIZE);
        }

        const fetchedFiles = await files.get(
          { entity: { $in: entitiesSharedIds }, type: 'document' },
          '_id entity language extractedMetadata'
        );

        const blankSuggestions: IXSuggestionType[] = [];
        fetchedFiles.forEach((file: FileType) => {
          const language = file.language
            ? languages.get(file.language, 'ISO639_1') || defaultLanguage
            : defaultLanguage;
          template.properties.forEach((propertyName: string) => {
            let state = SuggestionState.valueEmpty;
            if (file.extractedMetadata) {
              const metadata = file.extractedMetadata.find(
                (md: ExtractedMetadataSchema) => md.name === propertyName
              );
              if (metadata) {
                state = SuggestionState.labelEmpty;
              }
            }
            if (file.entity) {
              blankSuggestions.push({
                language,
                fileId: file._id,
                entityId: file.entity,
                propertyName,
                state,
                status: 'ready',
                error: '',
                segment: '',
                suggestedValue: '',
                date: new Date().getTime(),
              });
            }
          });
        });

        await IXSuggestionsModel.db
          .dbForCurrentTenant()
          .insertMany(blankSuggestions, { lean: true });
      }
    );
    await Promise.all(templatesPromises);
  },
};
