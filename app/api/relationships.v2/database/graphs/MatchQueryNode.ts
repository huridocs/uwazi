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
    return this.traversals.length ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
  }

  private compileTraversals() {
    return this.traversals.reduce<object[]>(
      (reduced, traversal, index) => reduced.concat(traversal.compile(index)),
      []
    );
  }

  private project() {
    const traversalFields = [];
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < this.traversals.length; index++) {
      traversalFields.push(`$traversal-${index}`);
    }

    return [
      {
        $project: {
          sharedId: 1,
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
            ...this.project(),
            ...this.unwind(),
          ],
        },
      },
    ];
  }
}
