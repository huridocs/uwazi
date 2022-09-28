/* eslint-disable class-methods-use-this */
import { ObjectId } from 'mongodb';
import { MatchQueryNode } from './graphs/MatchQueryNode';
import { RootQueryNode } from './graphs/RootQueryNode';
import { TraversalQueryNode } from './graphs/TraversalQueryNode';

const parentDirectionToField = {
  in: 'from',
  out: 'to',
} as const;

const directionToField = {
  in: 'to',
  out: 'from',
} as const;

function projectAndArrangeTraversals(projection: Record<string, 1>, childrenCount: number) {
  const traversalFields = [];
  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < childrenCount; index++) {
    traversalFields.push(`$traversal-${index}`);
  }

  return [
    {
      $project: { ...projection, traversal: { $concatArrays: traversalFields } },
    },
  ];
}

function unwind(childrenCount: number) {
  return childrenCount ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
}

const compilers = {
  traversal(query: TraversalQueryNode, index: number): object[] {
    return [
      {
        $lookup: {
          as: `traversal-${index}`,
          from: 'relationships',
          let: { sharedId: '$sharedId', visited: '$visited' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    ...(query.filters._id
                      ? [{ $eq: ['$_id', new ObjectId(query.filters._id)] }]
                      : []),
                    { $eq: ['$$sharedId', `$${directionToField[query.direction]}`] },
                    { $not: [{ $in: ['$_id', '$$visited'] }] },
                    ...(query.filters.types?.length
                      ? [{ $in: ['$type', query.filters.types.map(t => new ObjectId(t))] }]
                      : []),
                  ],
                },
              },
            },
            {
              $addFields: {
                visited: { $concatArrays: ['$$visited', ['$_id']] },
              },
            },
            ...query
              .getMatches()
              .reduce<object[]>(
                (reduced, nested, nestedIndex) =>
                  reduced.concat(compilers.match(nested, nestedIndex)),
                []
              ),
            ...projectAndArrangeTraversals(query.getProjection(), query.getMatches().length),
            ...unwind(query.getMatches().length),
          ],
        },
      },
    ];
  },

  match(query: MatchQueryNode, index: number): object[] {
    const sourceField = parentDirectionToField[query.getParent()!.direction];
    return [
      {
        $lookup: {
          as: `traversal-${index}`,
          from: 'entities',
          let: { [sourceField]: `$${sourceField}`, visited: '$visited' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    ...(query.filters.sharedId
                      ? [{ $eq: ['$sharedId', query.filters.sharedId] }]
                      : []),
                    { $eq: [`$$${sourceField}`, '$sharedId'] },
                    ...(query.filters.templates?.length
                      ? [{ $in: ['$template', query.filters.templates.map(t => new ObjectId(t))] }]
                      : []),
                  ],
                },
              },
            },
            {
              $addFields: {
                visited: '$$visited',
              },
            },
            ...query
              .getTraversals()
              .reduce<object[]>(
                (reduced, nested, nestedIndex) =>
                  reduced.concat(compilers.traversal(nested, nestedIndex)),
                []
              ),
            ...projectAndArrangeTraversals(query.getProjection(), query.getTraversals().length),
            ...unwind(query.getTraversals().length),
          ],
        },
      },
    ];
  },

  root(query: RootQueryNode): object[] {
    return [
      {
        $match: {
          $expr: {
            $and: [
              ...(query.filters.sharedId ? [{ $eq: ['$sharedId', query.filters.sharedId] }] : []),
              ...(query.filters.templates?.length
                ? [{ $in: ['$template', query.filters.templates.map(t => new ObjectId(t))] }]
                : []),
            ],
          },
        },
      },
      {
        $addFields: {
          visited: [],
        },
      },
      ...query
        .getTraversals()
        .reduce<object[]>(
          (reduced, nested, nestedIndex) =>
            reduced.concat(compilers.traversal(nested, nestedIndex)),
          []
        ),
      ...projectAndArrangeTraversals(query.getProjection(), query.getTraversals().length),
      ...unwind(query.getTraversals().length),
    ];
  },
};

export const compileQuery = compilers.root;
