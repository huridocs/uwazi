import { ObjectId } from 'mongodb';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { TraversalQueryNode } from '../model/TraversalQueryNode';

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
  for (let index = 0; index < childrenCount; index += 1) {
    traversalFields.push(`traversal-${index}`);
  }

  const traversal = { $concatArrays: traversalFields.map(field => `$${field}`) };

  return childrenCount
    ? [
        {
          $set: { traversal },
        },
        {
          $unset: traversalFields.concat(['visited']),
        },
        {
          $project: { ...projection, traversal: 1 },
        },
      ]
    : [
        {
          $unset: traversalFields.concat(['visited']),
        },
      ];
}

function unwind(childrenCount: number) {
  return childrenCount ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
}

const compilers = {
  traversal(query: TraversalQueryNode, index: number, language: string): object[] {
    const filters = query.getFilters();
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
                    ...(filters._id ? [{ $eq: ['$_id', new ObjectId(filters._id)] }] : []),
                    { $eq: ['$$sharedId', `$${directionToField[query.getDirection()]}.entity`] },
                    { $not: [{ $in: ['$_id', '$$visited'] }] },
                    ...(filters.types?.length
                      ? [{ $in: ['$type', filters.types.map(t => new ObjectId(t))] }]
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
              .reduce<
                object[]
              >((reduced, nested, nestedIndex) => reduced.concat(compilers.match(nested, nestedIndex, language)), []),
            ...projectAndArrangeTraversals(query.getProjection(), query.getMatches().length),
            ...unwind(query.getMatches().length),
          ],
        },
      },
    ];
  },

  match(query: MatchQueryNode, index: number, language: string): object[] {
    const filters = query.getFilters();
    const sourceField = parentDirectionToField[query.getParent()!.getDirection()];
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
                    ...(filters.sharedId ? [{ $eq: ['$sharedId', filters.sharedId] }] : []),
                    { $eq: [`$$${sourceField}.entity`, '$sharedId'] },
                    { $eq: ['$language', language] },
                    ...(filters.templates?.length
                      ? [{ $in: ['$template', filters.templates.map(t => new ObjectId(t))] }]
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
              .reduce<
                object[]
              >((reduced, nested, nestedIndex) => reduced.concat(compilers.traversal(nested, nestedIndex, language)), []),
            ...projectAndArrangeTraversals({ sharedId: 1, title: 1 }, query.getTraversals().length),
            ...unwind(query.getTraversals().length),
          ],
        },
      },
    ];
  },

  root(query: MatchQueryNode, language: string): object[] {
    const filters = query.getFilters();
    return [
      {
        $match: {
          $expr: {
            $and: [
              ...(filters.sharedId ? [{ $eq: ['$sharedId', filters.sharedId] }] : []),
              { $eq: ['$language', language] },
              ...(filters.templates?.length
                ? [{ $in: ['$template', filters.templates.map(t => new ObjectId(t))] }]
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
        .reduce<
          object[]
        >((reduced, nested, nestedIndex) => reduced.concat(compilers.traversal(nested, nestedIndex, language)), []),
      ...projectAndArrangeTraversals({ sharedId: 1, title: 1 }, query.getTraversals().length),
      ...unwind(query.getTraversals().length),
    ];
  },
};

export const compileQuery = compilers.root;
