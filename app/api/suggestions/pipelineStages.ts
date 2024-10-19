import { ObjectId } from 'mongodb';
import { FilterQuery } from 'mongoose';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { IXSuggestionType, SuggestionCustomFilter } from 'shared/types/suggestionType';

export const baseQueryFragment = (extractorId: ObjectId, ignoreProcessing = true) => {
  const query: FilterQuery<IXSuggestionType> = {
    extractorId,
  };
  if (ignoreProcessing) {
    query.status = { $ne: 'processing' };
  }
  return query;
};

export const filterFragments = {
  labeled: { 'state.labeled': true },
  nonLabeled: { 'state.labeled': false },
  match: { 'state.match': true },
  mismatch: { 'state.match': false },
  obsolete: { 'state.obsolete': true },
  error: { 'state.error': true },
};

export const translateCustomFilter = (customFilter: SuggestionCustomFilter) => {
  const orFilters = [];
  if (customFilter.labeled) orFilters.push(filterFragments.labeled);
  if (customFilter.nonLabeled) orFilters.push(filterFragments.nonLabeled);
  if (customFilter.match) orFilters.push(filterFragments.match);
  if (customFilter.mismatch) orFilters.push(filterFragments.mismatch);
  if (customFilter.obsolete) orFilters.push(filterFragments.obsolete);
  if (customFilter.error) orFilters.push(filterFragments.error);

  return orFilters;
};

export const getMatchStage = (
  extractorId: ObjectId,
  customFilter: SuggestionCustomFilter | undefined,
  countOnly = false
) => {
  const matchQuery: FilterQuery<IXSuggestionType> = baseQueryFragment(extractorId);
  if (customFilter) {
    const orFilters = translateCustomFilter(customFilter);
    if (orFilters.length > 0) matchQuery.$or = orFilters;
  }

  const countExpression = countOnly ? [{ $count: 'count' }] : [];

  const matchStage = [
    {
      $match: matchQuery,
    },
    ...countExpression,
  ];

  return matchStage;
};

export const getEntityStage = (languages: LanguagesListSchema) => {
  const defaultLanguage = languages.find(l => l.default)?.key;
  const configuredLanguages = languages.map(l => l.key);
  return [
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
  ];
};

export const getCurrentValueStage = () => [
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
      currentValue: '$currentValue.v',
    },
  },
  {
    $addFields: {
      currentValue: { $ifNull: ['$currentValue.value', []] },
    },
  },
];

export const getFileStage = () => [
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
];

export const getLabeledValueStage = () => [
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
];

export const getEntityTemplateFilterStage = (entityTemplates: string[] | undefined) =>
  entityTemplates
    ? [
        {
          $match: {
            entityTemplateId: { $in: (entityTemplates || []).map(id => new ObjectId(id)) },
          },
        },
      ]
    : [];

export const groupByAndCount = (field: string) => [
  {
    $group: {
      _id: field,
      count: { $sum: 1 },
    },
  },
];
