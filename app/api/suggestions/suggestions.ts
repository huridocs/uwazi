/* eslint-disable max-statements */
/* eslint-disable max-lines */
/* eslint-disable no-await-in-loop */
import entities from 'api/entities/entities';
import { files } from 'api/files/files';
import settings from 'api/settings/settings';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { SuggestionState } from 'shared/types/suggestionSchema';
import { ExtractedMetadataSchema, ObjectIdSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXSuggestionsFilter, IXSuggestionType } from 'shared/types/suggestionType';
import { updateStates } from './updateState';

//update flows:
// - suggestions (i.e. messages from the service - convention: suggestions are unique for file+property)
//    - save, saveMultiple (done, tested)
//    - accept (done, tested)
// - related model (match by propertyName) - raw mongoose model, no manager object
//    - save, but only when ready, not processing (see usages of IXModelsModel.save)
//    - delete (no usage for now)
// - file (match through fileId) (what can change? who changes it?)
//    - save
//    - delete (should delete the suggestion?)
// - entity (match through entityId)
//    - save
//    - delete (done, already handled by previous implementation, it deletes the suggestion)

export const Suggestions = {
  getById: async (id: ObjectIdSchema) => IXSuggestionsModel.getById(id),
  getByEntityId: async (sharedId: string) => IXSuggestionsModel.get({ entityId: sharedId }),
  // eslint-disable-next-line max-statements
  get: async (filter: IXSuggestionsFilter, options: { page: { size: number; number: number } }) => {
    const offset = options && options.page ? options.page.size * (options.page.number - 1) : 0;
    const DEFAULT_LIMIT = 30;
    const limit = options.page?.size || DEFAULT_LIMIT;
    const { languages } = await settings.get();
    // @ts-ignore
    const defaultLanguage = languages.find(l => l.default).key;
    //@ts-ignore
    const configuredLanguages = languages.map(l => l.key);
    const { language, ...filters } = filter;

    const [{ data, count }] = await IXSuggestionsModel.facet(
      [{ $match: { ...filters, status: 'ready' } }],
      {
        countBranch: [{ $group: { _id: null, count: { $sum: 1 } } }],
        dataBranch: [
          { $sort: { date: 1, state: -1 } }, // sort still needs to be before offset and limit
          { $skip: offset },
          { $limit: limit },
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
      },
      { count: '$countBranch.count', data: '$dataBranch' }
    );

    const totalPages = Math.ceil(count[0] / limit);
    return { suggestions: data, totalPages };
  },

  updateStates,

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
    await Suggestions.updateStates({ _id: acceptedSuggestion._id });
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
