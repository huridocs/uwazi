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

  compile(): object[] {
    return [
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
            ...this.matches.reduce<object[]>(
              (reduced, match) => reduced.concat(match.compile()),
              []
            ),
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
  }
}
