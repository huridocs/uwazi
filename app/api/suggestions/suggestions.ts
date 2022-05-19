/* eslint-disable max-lines */
/* eslint-disable no-await-in-loop */
import entities from 'api/entities/entities';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { IXSuggestionsFilter, IXSuggestionType } from 'shared/types/suggestionType';
import { EntitySchema } from 'shared/types/entityType';
import { ExtractedMetadataSchema, ObjectIdSchema } from 'shared/types/commonTypes';
import { IXModelsModel } from 'api/services/informationextraction/IXModelsModel';
import { SuggestionState } from 'shared/types/suggestionSchema';
import settings from 'api/settings/settings';
import { files } from 'api/files/files';

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
    const { languages } = await settings.get();
    // @ts-ignore
    const defaultLanguage = languages.find(l => l.default).key;
    //@ts-ignore
    const configuredLanguages = languages.map(l => l.key);
    const { state, language, ...filters } = filter;
    const [{ data, count }] = await IXSuggestionsModel.facet(
      [
        { $match: { ...filters, status: { $ne: 'processing' } } },
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
                      $lte: ['$date', model.creationDate],
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
};
