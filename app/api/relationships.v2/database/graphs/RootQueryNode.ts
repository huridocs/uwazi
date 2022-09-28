/* eslint-disable max-statements */
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { MatchQueryNode } from './MatchQueryNode';
import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

interface MatchFilters {
  sharedId?: string;
  templates?: string[];
}

export class RootQueryNode extends QueryNode {
  public filters: MatchFilters;

  private traversals: TraversalQueryNode[] = [];

  constructor(filters?: MatchFilters, traversals?: TraversalQueryNode[]) {
    super();
    this.filters = filters || {};
    traversals?.forEach(traversal => this.addTraversal(traversal));
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

  chainsDecomposition(): RootQueryNode[] {
    if (!this.traversals.length) return [new RootQueryNode({ ...this.filters })];

    const decomposition: RootQueryNode[] = [];
    const childrenDecompositions = this.traversals.map(traversal =>
      traversal.chainsDecomposition()
    );
    childrenDecompositions.forEach(childDecompositions => {
      childDecompositions.forEach(childDecomposition => {
        const newChain = new RootQueryNode({ ...this.filters });
        newChain.addTraversal(childDecomposition);
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
  ) {
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
      const newRoot = new RootQueryNode({ ...this.filters, sharedId: fromMatch.sharedId }, [
        new TraversalQueryNode(
          traversal.direction,
          {
            ...traversal.filters,
            _id: traverse._id,
          },
          [new MatchQueryNode({ ...node2.filters, sharedId: toMatch.sharedId })]
        ),
      ]);
      return newRoot;
    }

    const nextSatisfies = node2.reachesRelationship(traverse, matchData);

    if (nextSatisfies) {
      const newRoot = new RootQueryNode({ ...this.filters }, [
        new TraversalQueryNode(traversal.direction, { ...traversal.filters }, [nextSatisfies]),
      ]);
      return newRoot;
    }

    return false;
  }

  inverse() {
    this.validateIsChain();
    if (this.traversals[0]) {
      return this.traversals[0].inverse(new MatchQueryNode({ ...this.filters }));
    }
    return this;
  }
}
