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

  private compileTraversals() {
    return this.traversals.reduce<object[]>(
      (reduced, traversal, index) => reduced.concat(traversal.compile(index)),
      []
    );
  }

  private unwind() {
    return this.traversals.length ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
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
      ...this.compileTraversals(),
      ...this.project(),
      ...this.unwind(),
    ];
  }
}
