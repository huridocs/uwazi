/* eslint-disable max-lines */
import { Relationship } from 'api/relationships.v2/model/Relationship';
import _ from 'lodash';
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

interface TemplateRecordElement {
  path: number[];
  templates: string[];
}

type TemplateRecords = TemplateRecordElement[];

export class MatchQueryNode extends QueryNode {
  private filters: MatchFilters;

  private traversals: TraversalQueryNode[] = [];

  private parent?: TraversalQueryNode;

  constructor(filters?: MatchFilters, traversals?: TraversalQueryNode[]) {
    super();
    this.filters = filters || {};
    traversals?.forEach(t => {
      this.traversals.push(t);
      t.setParent(this);
    });
  }

  protected getChildrenNodes(): QueryNode[] {
    return this.traversals;
  }

  getFilters() {
    return { ...this.filters };
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

  isSame(other: MatchQueryNode): boolean {
    return (
      _.isEqual(this.filters, other.filters) &&
      this.traversals.length === other.traversals.length &&
      this.traversals.every((traversal, index) => traversal.isSame(other.traversals[index]))
    );
  }

  getDepth(): number {
    if (!this.traversals.length) {
      return 0;
    }

    return 1 + Math.max(...this.traversals.map(traversal => traversal.getDepth()));
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

  getTemplates(
    path: number[] = [],
    _records: TemplateRecords | undefined = undefined
  ): TemplateRecords {
    const records = _records || [];
    records.push({
      path,
      templates: this.filters.templates || [],
    });
    if (this.traversals.length) {
      this.traversals.forEach((t, index) => t.getTemplates([...path, index], records));
    }
    return records;
  }

  usesTemplate(templateId: string): boolean {
    return (
      this.filters.templates?.includes(templateId) ||
      this.traversals.some(traversal => traversal.usesTemplate(templateId))
    );
  }

  usesType(typeId: string): boolean {
    return this.traversals.some(traversal => traversal.usesType(typeId));
  }

  getRelationTypes(
    path: number[] = [],
    _records: TemplateRecords | undefined = undefined
  ): TemplateRecords {
    const records = _records || [];
    if (this.traversals.length) {
      this.traversals.forEach((t, index) => t.getRelationTypes([...path, index], records));
    }
    return records;
  }

  getTemplatesInLeaves(path: number[] = []): TemplateRecords {
    if (!this.traversals?.length) {
      return [
        {
          path,
          templates: this.filters.templates || [],
        },
      ];
    }

    return this.traversals.map((t, index) => t.getTemplatesInLeaves([...path, index])).flat();
  }

  // eslint-disable-next-line max-statements
  determinesRelationships(): false | string[] {
    const hasDepth2 = this.getDepth() === 2;
    const hasSingleTypePerBranch = this.traversals.every(
      traversal => traversal.getFilters().types?.length === 1
    );

    let hasAllTemplates = false;

    const templatesOccurences: Record<string, number> = {};
    const templatesInLeaves = this.getTemplatesInLeaves();
    templatesInLeaves.forEach(record => {
      if (record.templates.length === 0) {
        hasAllTemplates = true;
      }

      record.templates.forEach(template => {
        if (!templatesOccurences[template]) {
          templatesOccurences[template] = 0;
        }

        templatesOccurences[template] += 1;
      });
    });

    const hasOneLeaf = templatesInLeaves.length === 1;

    const templatesAppearOnce = Object.values(templatesOccurences).every(count => count === 1);

    if (hasAllTemplates && hasOneLeaf) {
      return [];
    }

    if (hasDepth2 && hasSingleTypePerBranch && templatesAppearOnce && !hasAllTemplates) {
      return Object.keys(templatesOccurences);
    }

    return false;
  }

  determineRelationship(targetEntity: Entity): {
    type: string;
    to: string;
    from: string;
  } {
    if (!this.filters.sharedId) {
      throw new Error(
        'The query must be rooted in an entity to be able to determine a relationship.'
      );
    }

    const templatesInLeaves = this.getTemplatesInLeaves();
    const matchingBranch = templatesInLeaves.find(record =>
      record.templates.includes(targetEntity.template)
    );

    if (!matchingBranch) {
      throw new Error('Cannot determine relationship: no match for the template');
    }

    const matchingTraversal = this.traversals[matchingBranch.path[0]];
    const direction = matchingTraversal.getDirection();

    return {
      type: matchingTraversal.getFilters().types![0],
      from: direction === 'out' ? this.filters.sharedId : targetEntity.sharedId,
      to: direction === 'out' ? targetEntity.sharedId : this.filters.sharedId,
    };
  }

  static forEntity(sharedId: string, traversals?: TraversalQueryNode[]) {
    return new MatchQueryNode({ sharedId }, traversals);
  }
}

export type { TemplateRecordElement, TemplateRecords };
