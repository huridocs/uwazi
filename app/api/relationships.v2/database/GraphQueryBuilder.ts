import { EdgeQuery, InternalNodeQuery, RelationshipsQuery } from '../services/RelationshipsQuery';

const lookupRoot = (sharedId: string, nested: object[]) => [
  {
    $match: {
      sharedId,
    },
  },
  ...nested,
  {
    $project: {
      sharedId: 1,
      traversal: 1,
    },
  },
  {
    $unwind: '$traversal',
  },
];

const lookupEntity = (sourceField: 'from' | 'to', nested: object[]) => [
  {
    $lookup: {
      as: 'traversal',
      from: 'entities',
      let: { [sourceField]: `$${sourceField}` },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: [`$$${sourceField}`, '$sharedId'],
            },
          },
        },
        ...nested,
        {
          $project: {
            sharedId: 1,
            traversal: 1,
          },
        },
        ...(nested.length
          ? [
              {
                $unwind: '$traversal',
              },
            ]
          : []),
      ],
    },
  },
];

const lookupRelationship = (targetField: 'from' | 'to', nested: object[]) => [
  {
    $lookup: {
      as: 'traversal',
      from: 'relationships',
      let: { sharedId: '$sharedId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $eq: ['$$sharedId', `$${targetField}`],
            },
          },
        },
        ...nested,
        {
          $project: {
            type: 1,
            traversal: 1,
          },
        },
        {
          $unwind: '$traversal',
        },
      ],
    },
  },
];

function mapMatch(_subquery: InternalNodeQuery, field: 'to' | 'from') {
  return lookupEntity(field, []);
}

function mapTraversal(subquery: EdgeQuery) {
  const directionToField = {
    in: 'to',
    out: 'from',
  } as const;

  const otherField = {
    to: 'from',
    from: 'to',
  } as const;

  const field = directionToField[subquery.direction];
  const nextField = otherField[field];

  return lookupRelationship(
    directionToField[subquery.direction],
    subquery.match.reduce<object[]>(
      (nested, submatch) => nested.concat(mapMatch(submatch, nextField)),
      []
    )
  );
}

export function buildAggregationPipeline(query: RelationshipsQuery) {
  return lookupRoot(
    query.sharedId,
    (query.traverse || []).reduce<object[]>(
      (nested, subtraversal) => nested.concat(mapTraversal(subtraversal)),
      []
    )
  );
}
