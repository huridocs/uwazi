/* eslint-disable max-statements */
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { QueryNode } from './QueryNode';
import { RootQueryNode } from './RootQueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

interface MatchFilters {
  sharedId?: string;
  templates?: string[];
}

export class MatchQueryNode extends QueryNode {
  public filters: MatchFilters;

  private traversals: TraversalQueryNode[] = [];

  private parent?: TraversalQueryNode;

  constructor(filters?: MatchFilters, traversals?: TraversalQueryNode[]) {
    super();
    this.filters = filters || {};
    traversals?.forEach(t => this.addTraversal(t));
  }

  protected getChildrenNodes(): QueryNode[] {
    return this.traversals;
  }

  // eslint-disable-next-line class-methods-use-this
  getProjection() {
    return {
      sharedId: 1,
    } as const;
  }

  addTraversal(traversal: TraversalQueryNode) {
    this.traversals.push(traversal);
    traversal.setParent(this);
  }

  getTraversals() {
    return this.traversals as readonly TraversalQueryNode[];
  }

  setParent(parent: TraversalQueryNode) {
    this.parent = parent;
  }

  getParent() {
    return this.parent;
  }

  chainsDecomposition(): MatchQueryNode[] {
    if (!this.traversals.length) return [new MatchQueryNode({ ...this.filters })];

    const decomposition: MatchQueryNode[] = [];
    const childrenDecompositions = this.traversals.map(traversal =>
      traversal.chainsDecomposition()
    );

    childrenDecompositions.forEach(childDecompositions => {
      childDecompositions.forEach(childDecomposition => {
        const newChain = new MatchQueryNode({ ...this.filters }, [childDecomposition]);
        decomposition.push(newChain);
      });
    });

    return decomposition;
  }

  filtersWouldMatch(match: { sharedId: string; template: string }) {
    return (
      (this.filters.sharedId ? this.filters.sharedId === match.sharedId : true) &&
      (this.filters.templates ? this.filters.templates.includes(match.template) : true)
    );
  }

  reachesRelationship(
    traverse: Relationship,
    matchData: { [sharedId: string]: { sharedId: string; template: string } }
  ): MatchQueryNode | false {
    this.validateIsChain();

    const node1 = this;
    const traversal = this.traversals[0];

    traversal?.validateIsChain();

    const node2 = traversal?.getMatches()[0];
    if (!traversal || !node2) return false;

    const fromMatch = matchData[traverse[traversal.direction === 'out' ? 'from' : 'to']];
    const toMatch = matchData[traverse[traversal.direction === 'out' ? 'to' : 'from']];

    const satisfies =
      node1.filtersWouldMatch(fromMatch) &&
      traversal.wouldTraverse(fromMatch.sharedId, traverse, toMatch.sharedId) &&
      node2.filtersWouldMatch(toMatch);

    if (satisfies) {
      const newRoot = new MatchQueryNode(
        {
          ...this.filters,
          sharedId: fromMatch.sharedId,
        },
        [
          new TraversalQueryNode(
            traversal.direction,
            {
              ...traversal.filters,
              _id: traverse._id,
            },
            [
              new MatchQueryNode({
                ...node2.filters,
                sharedId: toMatch.sharedId,
              }),
            ]
          ),
        ]
      );
      return newRoot;
    }

    const nextSatisfies = node2.reachesRelationship(traverse, matchData);

    if (nextSatisfies) {
      const newRoot = new MatchQueryNode({ ...this.filters }, [
        new TraversalQueryNode(traversal.direction, { ...traversal.filters }, [nextSatisfies]),
      ]);
      return newRoot;
    }

    return false;
  }

  inverse(next: TraversalQueryNode): RootQueryNode {
    this.validateIsChain();
    if (this.traversals[0]) {
      const inversed = new MatchQueryNode({ ...this.filters }, [next]);
      return this.traversals[0].inverse(inversed);
    }
    const inversed = new RootQueryNode({ ...this.filters }, [next]);
    return inversed;
  }
}
