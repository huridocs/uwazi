import { ObjectId } from 'mongodb';
import { MatchQueryNode } from './MatchQueryNode';
import { QueryNode } from './QueryNode';

export class TraversalQueryNode implements QueryNode {
  private targetField: string;

  private types: ObjectId[];

  private matches: MatchQueryNode[] = [];

  constructor(targetField: 'from' | 'to', types: ObjectId[]) {
    this.targetField = targetField;
    this.types = types;
  }

  addMatch(match: MatchQueryNode) {
    this.matches.push(match);
  }

  private compileMatches() {
    return this.matches.reduce<object[]>(
      (reduced, match, index) => reduced.concat(match.compile(index)),
      []
    );
  }

  private unwind() {
    return this.matches.length ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
  }

  private project() {
    const traversalFields = [];
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < this.matches.length; index++) {
      traversalFields.push(`$traversal-${index}`);
    }

    return [
      {
        $project: {
          type: 1,
          traversal: { $concatArrays: traversalFields },
        },
      },
    ];
  }

  compile(index: number): object[] {
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
                    { $eq: ['$$sharedId', `$${this.targetField}`] },
                    { $not: [{ $in: ['$_id', '$$visited'] }] },
                    ...(this.types.length ? [{ $in: ['$type', this.types] }] : []),
                  ],
                },
              },
            },
            {
              $addFields: {
                visited: { $concatArrays: ['$$visited', ['$_id']] },
              },
            },
            ...this.compileMatches(),
            ...this.project(),
            ...this.unwind(),
          ],
        },
      },
    ];
  }
}
