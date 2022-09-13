import { ObjectId } from 'mongodb';
import { EdgeQuery, InternalNodeQuery, RelationshipsQuery } from '../services/RelationshipsQuery';

const lookupRoot = (sharedId: string, nested: object[]) => [
  {
    $match: {
      sharedId,
    },
  },
  {
    $addFields: {
      visited: [],
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

const lookupEntity = (sourceField: 'from' | 'to', templates: ObjectId[], nested: object[]) => [
  {
    $lookup: {
      as: 'traversal',
      from: 'entities',
      let: { [sourceField]: `$${sourceField}`, visited: '$visited' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: [`$$${sourceField}`, '$sharedId'] },
                ...(templates.length ? [{ $in: ['$template', templates] }] : []),
              ],
            },
          },
        },
        {
          $addFields: {
            visited: '$$visited',
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
      let: { sharedId: '$sharedId', visited: '$visited' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$$sharedId', `$${targetField}`] },
                { $not: [{ $in: ['$_id', '$$visited'] }] },
              ],
            },
          },
        },
        {
          $addFields: {
            visited: { $concatArrays: ['$$visited', ['$_id']] },
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

function mapMatch(subquery: InternalNodeQuery, field: 'to' | 'from'): object[] {
  return lookupEntity(
    field,
    (subquery.templates || []).map(t => new ObjectId(t)),
    (subquery.traverse || []).reduce<object[]>(
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      (nested, traversal) => nested.concat(mapTraversal(traversal)),
      []
    )
  );
}

function mapTraversal(subquery: EdgeQuery): object[] {
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
