import { ObjectId } from 'mongodb';
import { MatchQueryNode } from './MatchQueryNode';
import { QueryNode } from './QueryNode';

export class TraversalQueryNode extends QueryNode {
  private targetField: string;

  private types: ObjectId[];

  private matches: MatchQueryNode[] = [];

  constructor(targetField: 'from' | 'to', types: ObjectId[]) {
    super();
    this.targetField = targetField;
    this.types = types;
  }

  protected getChildrenNodes(): QueryNode[] {
    return this.matches;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getProjection() {
    return {
      type: 1,
    };
  }

  addMatch(match: MatchQueryNode) {
    this.matches.push(match);
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
            ...this.compileChildren(),
            ...this.projectAndArrangeTraversals(),
            ...this.unwind(),
          ],
        },
      },
    ];
  }
}
