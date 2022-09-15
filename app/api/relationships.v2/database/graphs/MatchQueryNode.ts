import { ObjectId } from 'mongodb';
import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

export class MatchQueryNode extends QueryNode {
  private sourceField: string;

  private templates: ObjectId[];

  private traversals: TraversalQueryNode[] = [];

  constructor(sourceField: 'from' | 'to', templates: ObjectId[]) {
    super();
    this.sourceField = sourceField;
    this.templates = templates;
  }

  protected getChildrenNodes(): QueryNode[] {
    return this.traversals;
  }

  // eslint-disable-next-line class-methods-use-this
  protected getProjection() {
    return {
      sharedId: 1,
    };
  }

  addTraversal(traversal: TraversalQueryNode) {
    this.traversals.push(traversal);
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
            ...this.compileChildren(),
            ...this.projectAndArrangeTraversals(),
            ...this.unwind(),
          ],
        },
      },
    ];
  }
}
