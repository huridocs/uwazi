import { ObjectId } from 'mongodb';
import { FilterQuery } from 'mongoose';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { IXSuggestionType, SuggestionCustomFilter } from 'shared/types/suggestionType';

// eslint-disable-next-line max-statements
const translateCustomFilter = (customFilter: SuggestionCustomFilter) => {
  const orFilters = [];
  if (customFilter.labeled.match) {
    orFilters.push({ 'state.labeled': true, 'state.match': true });
  }
  if (customFilter.labeled.mismatch) {
    orFilters.push({ 'state.labeled': true, 'state.match': false });
  }

  if (customFilter.nonLabeled.noSuggestion) {
    orFilters.push({ 'state.labeled': false, 'state.withSuggestion': false });
  }
  if (customFilter.nonLabeled.noContext) {
    orFilters.push({
      'state.labeled': false,
      'state.hasContext': false,
    });
  }
  if (customFilter.nonLabeled.obsolete) {
    orFilters.push({
      'state.labeled': false,
      'state.obsolete': true,
    });
  }
  if (customFilter.nonLabeled.others) {
    orFilters.push({
      'state.labeled': false,
      'state.error': true,
    });
  }
  return orFilters;
};

export const getMatchStage = (
  filters: FilterQuery<IXSuggestionType>,
  customFilter: SuggestionCustomFilter | undefined,
  countOnly = false
) => {
  const matchQuery = {
    ...filters,
    status: { $ne: 'processing' },
  };
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
      currentValue: { $arrayElemAt: ['$currentValue.v', 0] },
    },
  },
  {
    $addFields: {
      currentValue: { $ifNull: ['$currentValue.value', ''] },
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

export const groupByAndSort = (field: string) => [
  {
    $group: {
      _id: field,
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
];
