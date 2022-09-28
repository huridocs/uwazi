import { Relationship } from 'api/relationships.v2/model/Relationship';
import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

interface MatchFilters {
  sharedId?: string;
  templates?: string[];
}

interface EntitiesMap {
  [sharedId: string]: { sharedId: string; template: string };
}

const sortEntitiesInTraversalOrder = (
  entityData: EntitiesMap,
  relationship: Relationship,
  direction: 'in' | 'out'
) => {
  const relSideGivenDirection = {
    out: {
      first: 'from',
      second: 'to',
    } as const,
    in: {
      first: 'to',
      second: 'from',
    } as const,
  } as const;

  const first = entityData[relationship[relSideGivenDirection[direction].first]];
  const second = entityData[relationship[relSideGivenDirection[direction].second]];

  return [first, second];
};

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

  wouldMatch(match: { sharedId: string; template: string }) {
    return (
      (this.filters.sharedId ? this.filters.sharedId === match.sharedId : true) &&
      (this.filters.templates ? this.filters.templates.includes(match.template) : true)
    );
  }

  private static buildQueryFittedToRelationship(
    firstSharedId: string,
    relationshipId: string,
    direction: 'in' | 'out',
    secondSharedId: string
  ) {
    return new MatchQueryNode(
      {
        sharedId: firstSharedId,
      },
      [
        new TraversalQueryNode(
          direction,
          {
            _id: relationshipId,
          },
          [
            new MatchQueryNode({
              sharedId: secondSharedId,
            }),
          ]
        ),
      ]
    );
  }

  private getCurrentStepToMatchRelationship() {
    this.validateIsChain();

    const traversalNode = this.traversals[0];
    if (!traversalNode) {
      return false;
    }
    traversalNode.validateIsChain();

    const targetMatchNode = traversalNode.getMatches()[0];
    if (!targetMatchNode) {
      return false;
    }

    return [this, traversalNode, targetMatchNode] as const;
  }

  // eslint-disable-next-line max-statements
  reachesRelationship(relationship: Relationship, entityData: EntitiesMap): MatchQueryNode | false {
    const currentStep = this.getCurrentStepToMatchRelationship();

    if (!currentStep) {
      return false;
    }

    const [currentMatchNode, traversalNode, targetMatchNode] = currentStep;

    const [toMatchBeforeTraverse, toMatchAfterTraverse] = sortEntitiesInTraversalOrder(
      entityData,
      relationship,
      traversalNode.direction
    );

    const thisStepWouldReachRelationship =
      currentMatchNode.wouldMatch(toMatchBeforeTraverse) &&
      traversalNode.wouldTraverse(
        toMatchBeforeTraverse.sharedId,
        relationship,
        toMatchAfterTraverse.sharedId
      ) &&
      targetMatchNode.wouldMatch(toMatchAfterTraverse);

    if (thisStepWouldReachRelationship) {
      return MatchQueryNode.buildQueryFittedToRelationship(
        toMatchBeforeTraverse.sharedId,
        relationship._id,
        traversalNode.direction,
        toMatchAfterTraverse.sharedId
      );
    }

    const nextStepReachingQuery = targetMatchNode.reachesRelationship(relationship, entityData);

    if (nextStepReachingQuery) {
      return new MatchQueryNode({ ...currentMatchNode.filters }, [
        new TraversalQueryNode(traversalNode.direction, { ...traversalNode.filters }, [
          nextStepReachingQuery,
        ]),
      ]);
    }

    return false;
  }

  inverse(next?: TraversalQueryNode): MatchQueryNode {
    this.validateIsChain();
    if (this.traversals[0]) {
      const inversed = new MatchQueryNode({ ...this.filters }, next ? [next] : []);
      return this.traversals[0].inverse(inversed);
    }
    return new MatchQueryNode({ ...this.filters }, next ? [next] : []);
  }
}
