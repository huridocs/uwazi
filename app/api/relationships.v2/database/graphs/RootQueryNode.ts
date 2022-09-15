import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

export class RootQueryNode extends QueryNode {
  private sharedId: string;

  private traversals: TraversalQueryNode[] = [];

  constructor(sharedId: string) {
    super();
    this.sharedId = sharedId;
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

  compile() {
    return [
      {
        $match: {
          sharedId: this.sharedId,
        },
      },
      {
        $addFields: {
          visited: [],
        },
      },
      ...this.compileChildren(),
      ...this.projectAndArrangeTraversals(),
      ...this.unwind(),
    ];
  }
}
