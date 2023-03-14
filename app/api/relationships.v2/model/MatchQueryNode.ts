import { Relationship } from 'api/relationships.v2/model/Relationship';
import { QueryNode } from './QueryNode';
import { TraversalQueryNode } from './TraversalQueryNode';

interface MatchFilters {
  sharedId?: string;
  templates?: string[];
}

// Temporal type definition
interface Entity {
  sharedId: string;
  template: string;
}

interface EntitiesMap {
  [sharedId: string]: Entity;
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

  wouldMatch(entity: Entity) {
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

  reachesEntity(entity: Entity): MatchQueryNode | undefined {
    this.validateIsChain();

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

  private invertingAlgorithm(
    fittingCallback: (subquery: MatchQueryNode) => MatchQueryNode | undefined
  ) {
    const subqueries = this.chainsDecomposition();
    const invertedFittingQueries: MatchQueryNode[] = [];
    subqueries.forEach(subquery => {
      const fittingQuery = fittingCallback(subquery);
      if (fittingQuery) {
        invertedFittingQueries.push(fittingQuery.inverse());
      }
    });
    return invertedFittingQueries;
  }

  invertFromRelationship(relationship: Relationship, entitiesInRelationship: Entity[]) {
    const entityMap = {
      [relationship.from.entity]: entitiesInRelationship.find(
        entity => entity.sharedId === relationship.from.entity
      )!,
      [relationship.to.entity]: entitiesInRelationship.find(
        entity => entity.sharedId === relationship.to.entity
      )!,
    };

    return this.invertingAlgorithm(subquery =>
      subquery.reachesRelationship(relationship, entityMap)
    );
  }

  invertFromEntity(entity: Entity) {
    return this.invertingAlgorithm(subquery => subquery.reachesEntity(entity));
  }

  static forEntity(entity: Entity, traversals?: TraversalQueryNode[]) {
    return new MatchQueryNode({ sharedId: entity.sharedId }, traversals);
  }
}
