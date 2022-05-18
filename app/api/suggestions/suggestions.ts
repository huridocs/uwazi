/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable no-await-in-loop */
import entities from 'api/entities/entities';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { IXSuggestionsFilter } from 'shared/types/suggestionType';
import { EntitySchema } from 'shared/types/entityType';
import { ExtractedMetadataSchema, ObjectIdSchema } from 'shared/types/commonTypes';
import { IXModelsModel } from 'api/services/informationextraction/IXModelsModel';
import { SuggestionState } from 'shared/types/suggestionSchema';
import settings from 'api/settings/settings';
import { files } from 'api/files/files';
import entitiesModel from 'api/entities/entitiesModel';
import languages from 'shared/languages';

interface ISettingsTemplate {
  template: string | ObjectIdSchema;
  properties: string[];
}

export const Suggestions = {
  getById: async (id: ObjectIdSchema) => IXSuggestionsModel.getById(id),
  getByEntityId: async (sharedId: string) => IXSuggestionsModel.get({ entityId: sharedId }),
  // eslint-disable-next-line max-statements
  get: async (filter: IXSuggestionsFilter, options: { page: { size: number; number: number } }) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const [model] = await IXModelsModel.get({
      propertyName: filter.propertyName,
      status: 'ready',
    });
    const { languages: dbLanguages } = await settings.get();
    // @ts-ignore
    const defaultLanguage = dbLanguages.find(l => l.default).key;
    //@ts-ignore
    const configuredLanguages = dbLanguages.map(l => l.key);
    const { state, language, ...filters } = filter;
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [
        { $match: { ...filters } },
        {
          $lookup: {
            from: 'entities',
            let: {
              localFieldEntityId: '$entityId',
              localFieldLanguage: {
                $cond: [
                  {
                    $not: [{ $in: ['$language', configuredLanguages] }],
                  },
                  defaultLanguage,
                  '$language',
                ],
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$sharedId', '$$localFieldEntityId'] },
                      { $eq: ['$language', '$$localFieldLanguage'] },
                    ],
                  },
                },
              },
            ],
            as: 'entity',
          },
        },
        {
          $addFields: { entity: { $arrayElemAt: ['$entity', 0] } },
        },
        {
          $addFields: {
            currentValue: {
              $cond: [
                { $eq: ['$propertyName', 'title'] },
                { v: [{ value: '$entity.title' }] },
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: {
                          $objectToArray: '$entity.metadata',
                        },
                        as: 'property',
                        cond: {
                          $eq: ['$$property.k', '$propertyName'],
                        },
                      },
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            currentValue: { $arrayElemAt: ['$currentValue.v', 0] },
          },
        },
        {
          $addFields: {
            currentValue: { $ifNull: ['$currentValue.value', ''] },
          },
        },
        {
          $lookup: {
            from: 'files',
            let: {
              localFieldFileId: '$fileId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$localFieldFileId'],
                  },
                },
              },
            ],
            as: 'file',
          },
        },
        {
          $addFields: { file: { $arrayElemAt: ['$file', 0] } },
        },
        {
          $addFields: {
            labeledValue: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$file.extractedMetadata',
                    as: 'label',
                    cond: {
                      $eq: ['$propertyName', '$$label.name'],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            labeledValue: '$labeledValue.selection.text',
          },
        },
        {
          $addFields: {
            state: {
              $switch: {
                branches: [
                  {
                    case: {
                      $ne: ['$error', ''],
                    },
                    then: 'Error',
                  },
                  {
                    case: {
                      $lte: ['$date', model ? model.creationDate : 0],
                    },
                    then: SuggestionState.obsolete,
                  },
                  {
                    case: {
                      $and: [
                        { $lte: ['$labeledValue', null] },
                        { $eq: ['$suggestedValue', ''] },
                        { $ne: ['$currentValue', ''] },
                      ],
                    },
                    then: SuggestionState.valueEmpty,
                  },
                  {
                    case: {
                      $and: [
                        { $eq: ['$suggestedValue', '$currentValue'] },
                        { $eq: ['$suggestedValue', '$labeledValue'] },
                      ],
                    },
                    then: SuggestionState.labelMatch,
                  },
                  {
                    case: {
                      $and: [{ $eq: ['$currentValue', ''] }, { $eq: ['$suggestedValue', ''] }],
                    },
                    then: SuggestionState.empty,
                  },
                  {
                    case: {
                      $and: [
                        { $eq: ['$labeledValue', '$currentValue'] },
                        { $ne: ['$labeledValue', '$suggestedValue'] },
                        { $eq: ['$suggestedValue', ''] },
                      ],
                    },
                    then: SuggestionState.labelEmpty,
                  },
                  {
                    case: {
                      $and: [
                        { $eq: ['$labeledValue', '$currentValue'] },
                        { $ne: ['$labeledValue', '$suggestedValue'] },
                      ],
                    },
                    then: SuggestionState.labelMismatch,
                  },
                  {
                    case: {
                      $and: [{ $eq: ['$suggestedValue', '$currentValue'] }],
                    },
                    then: SuggestionState.valueMatch,
                  },
                ],
                default: SuggestionState.valueMismatch,
              },
            },
          },
        },
        ...(state ? [{ $match: { $expr: { $eq: ['$state', state] } } }] : []),
        { $sort: { date: 1, state: -1 } },
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
      ],
      {
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [{ $skip: offset }, { $limit: limit }],
      },
      { count: '$stage1.count', data: '$stage2' }
    );

    const totalPages = Math.ceil(count[0] / limit);
    return { suggestions: data, totalPages };
  },

  accept: async (
    acceptedSuggestion: {
      _id: ObjectIdSchema;
      sharedId: string;
      entityId: string;
    },
    allLanguages: boolean
  ) => {
    const suggestion = await IXSuggestionsModel.getById(acceptedSuggestion._id);
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }
    if (suggestion.error !== '') {
      throw new Error('Suggestion has an error');
    }
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

    const fetchedFiles = await files.get({ _id: suggestion.fileId });
    if (fetchedFiles.length > 0) {
      const file = fetchedFiles[0];
      const newTextSelection = suggestion.selectionRectangles;
      if (!file.extractedMetadata) {
        const newExtractedMetadata: any[] = [
          {
            name: suggestion.propertyName,
            timestamp: Date(),
            selection: {
              text: suggestion.suggestedValue,
              selectionRectangles: newTextSelection,
            },
          },
        ];
        file.extractedMetadata = newExtractedMetadata;
      } else {
        const extractedMetadata = file.extractedMetadata.find(
          (em: any) => em.name === suggestion.propertyName
        );
        if (!extractedMetadata) {
          file.extractedMetadata.push({
            name: suggestion.propertyName,
            timestamp: Date(),
            selection: {
              text: suggestion.suggestedValue as string,
              selectionRectangles: newTextSelection,
            },
          });
        } else {
          (extractedMetadata as ExtractedMetadataSchema).timestamp = Date();
          (extractedMetadata as ExtractedMetadataSchema).selection = {
            text: suggestion.suggestedValue as string,
            selectionRectangles: newTextSelection,
          };
        }
      }
      await files.save(file);
    }

    await entities.saveMultiple(entitiesToUpdate);
  },
  deleteByEntityId: async (sharedId: string) => {
    await IXSuggestionsModel.delete({ entityId: sharedId });
  },
  deleteByProperty: async (propertyName: string, templateId: string) => {
    const cursor = IXSuggestionsModel.db.find({ propertyName }).cursor();

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

  deleteSuggestionsNotConfigured: async (
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
      const deletedTemplateIds = deletedTemplatesAndDeletedTemplateProps.map(
        temps => temps.template
      );

      const entitiesDoc = await entities.get({ template: { $in: deletedTemplateIds } }, 'sharedId');

      const entitiesSharedIds = entitiesDoc.map((entity: any) => entity.sharedId);
      const propNames: string[] = deletedTemplatesAndDeletedTemplateProps.reduce(
        (acc, curr) => [...acc, ...curr.properties],
        []
      );
      const uniquePropNames: string[] = [...new Set<string>(propNames)];

      await IXSuggestionsModel.db.deleteMany({
        $and: [
          { entityId: { $in: entitiesSharedIds } },
          { propertyName: { $in: uniquePropNames } },
        ],
      });
    }
  },

  getTemplateDifference: (
    currentSettingsTemplates: ISettingsTemplate[],
    settingsTemplates: ISettingsTemplate[]
  ) => {
    const newTemplates = settingsTemplates.filter(temp => {
      const oldTemplateIds = currentSettingsTemplates?.map(oldTemp => oldTemp.template) || [];
      return !oldTemplateIds.includes(temp.template);
    });

    const combedNewTemplates = settingsTemplates
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

    return newTemplates.concat(combedNewTemplates as ISettingsTemplate[]);
  },

  saveConfigurations: async (settingsTemplates: ISettingsTemplate[]) => {
    const currentSettings = await settings.get();
    const defaultLanguage = currentSettings?.languages?.find(lang => lang.default)?.key;
    let currentSettingsTemplates: ISettingsTemplate[] | undefined =
      currentSettings.features?.metadataExtraction?.templates;
    currentSettingsTemplates = currentSettingsTemplates || [];

    await Suggestions.deleteSuggestionsNotConfigured(currentSettingsTemplates, settingsTemplates);
    // @ts-ignore
    currentSettings.features.metadataExtraction.templates = settingsTemplates;
    await settings.save(currentSettings);

    const newTemplates = Suggestions.getTemplateDifference(
      currentSettingsTemplates,
      settingsTemplates
    );
    await Suggestions.createBlankState(newTemplates, defaultLanguage as string);

    return currentSettings;
  },

  fetchEntitiesBatch: async (query: any, limit: number = 100) =>
    entitiesModel.db.find(query).select('sharedId').limit(limit).sort({ _id: 1 }).exec(),

  createBlankState: async (settingsTemplates: any[], defaultLanguage: string) => {
    const templatesPromises = settingsTemplates.map(
      async (template: { template: string; properties: string[] }) => {
        const BATCH_SIZE = 2000;
        let query: any = {
          template: template.template,
          language: defaultLanguage,
        };

        const entitiesSharedIds: string[] = [];

        let fetchedEntities = await Suggestions.fetchEntitiesBatch(query, BATCH_SIZE);
        while (fetchedEntities.length) {
          const sharedIds = fetchedEntities.map(entity => entity.sharedId);
          entitiesSharedIds.push(...(sharedIds as string[]));
          query = {
            ...query,
            _id: { $gt: fetchedEntities[fetchedEntities.length - 1]._id },
          };
          fetchedEntities = await Suggestions.fetchEntitiesBatch(query, BATCH_SIZE);
        }

        const fetchedFiles = await files.get(
          { entity: { $in: entitiesSharedIds } },
          '_id entity language'
        );

        const blankSuggestions: any[] = [];
        fetchedFiles.forEach((file: any) => {
          const language = languages.get(file.language, 'ISO639_1') || 'other';
          template.properties.forEach((propertyName: string) => {
            blankSuggestions.push({
              language,
              fileId: file._id,
              entityId: file.entity,
              propertyName,
              status: 'processing',
              error: '',
              segment: '',
              suggestedValue: '',
              date: new Date().getTime(),
            });
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
