import { ObjectId } from 'mongodb';
import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

export class MatchQueryNode implements QueryNode {
  private sourceField: string;

  private templates: ObjectId[];

  private traversals: TraversalQueryNode[] = [];

  constructor(sourceField: 'from' | 'to', templates: ObjectId[]) {
    this.sourceField = sourceField;
    this.templates = templates;
  }

  addTraversal(traversal: TraversalQueryNode) {
    this.traversals.push(traversal);
  }

  private unwind() {
    return this.traversals.length
      ? [
          {
            $unwind: '$traversal',
          },
        ]
      : [];
  }

  private compileTraversals() {
    return this.traversals.reduce<object[]>(
      (reduced, traversal) => reduced.concat(traversal.compile()),
      []
    );
  }

  compile(): object[] {
    return [
      {
        $lookup: {
          as: 'traversal',
          from: 'entities',
          let: { [this.sourceField]: `$${this.sourceField}`, visited: '$visited' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: [`$$${this.sourceField}`, '$sharedId'] },
                    ...(this.templates.length ? [{ $in: ['$template', this.templates] }] : []),
                  ],
                },
              },
            },
            {
              $addFields: {
                visited: '$$visited',
              },
            },
            ...this.compileTraversals(),
            {
              $project: {
                sharedId: 1,
                traversal: 1,
              },
            },
            ...this.unwind(),
          ],
        },
      },
    ];
  }
}
