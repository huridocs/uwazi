import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

export class RootQueryNode implements QueryNode {
  private sharedId: string;

  private traversals: TraversalQueryNode[] = [];

  constructor(sharedId: string) {
    this.sharedId = sharedId;
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
      ...this.traversals.reduce<object[]>(
        (reduced, traversal) => reduced.concat(traversal.compile()),
        []
      ),
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
  }
}
