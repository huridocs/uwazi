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

export class MatchQueryNode extends QueryNode {
  private filters: MatchFilters;

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

  getFilters() {
    return { ...this.filters };
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
    if (!this.traversals.length) return [this.shallowClone()];

    const decomposition: MatchQueryNode[] = [];
    const childrenDecompositions = this.traversals.map(traversal =>
      traversal.chainsDecomposition()
    );

    childrenDecompositions.forEach(childDecompositions => {
      childDecompositions.forEach(childDecomposition => {
        decomposition.push(this.shallowClone([childDecomposition]));
      });
    });

    return decomposition;
  }

  wouldMatch(entity: { sharedId: string; template: string }) {
    return (
      (this.filters.sharedId ? this.filters.sharedId === entity.sharedId : true) &&
      (this.filters.templates ? this.filters.templates.includes(entity.template) : true)
    );
  }

  inverse(next?: TraversalQueryNode): MatchQueryNode {
    this.validateIsChain();
    const inversed = this.shallowClone(next ? [next] : []);
    return this.traversals[0] ? this.traversals[0].inverse(inversed) : inversed;
  }

  reachesRelationship(
    relationship: Relationship,
    entityData: EntitiesMap
  ): MatchQueryNode | undefined {
    this.validateIsChain();
    return this.traversals[0] && this.traversals[0].reachesRelationship(relationship, entityData);
  }

  reachesEntity(entity: { sharedId: string; template: string }): MatchQueryNode | undefined {
    this.validateIsChain();

    if (this.wouldMatch(entity)) {
      return new MatchQueryNode({ sharedId: entity.sharedId });
    }

    if (this.traversals[0]) {
      const nextReaches = this.traversals[0].reachesEntity(entity);
      if (nextReaches) {
        return this.shallowClone([nextReaches]);
      }
    }

    return undefined;
  }

  shallowClone(traversals?: TraversalQueryNode[]) {
    return new MatchQueryNode({ ...this.filters }, traversals ?? []);
  }
}
