import { Relationship } from 'api/relationships.v2/model/Relationship';
import _ from 'lodash';
import { MatchQueryNode, TemplateRecords } from './MatchQueryNode';
import { QueryNode } from './QueryNode';

interface TraversalFilters {
  _id?: string;
  types?: string[];
}

const inverseOfDirection = {
  in: 'out',
  out: 'in',
} as const;

// Temporal type definition
interface Entity {
  sharedId: string;
  template: string;
}

interface EntitiesMap {
  [sharedId: string]: Entity;
}

export class TraversalQueryNode extends QueryNode {
  private direction: 'in' | 'out';

  private filters: TraversalFilters;

  private parent?: MatchQueryNode;

  private matches: MatchQueryNode[] = [];

  constructor(direction: 'in' | 'out', filters?: TraversalFilters, matches?: MatchQueryNode[]) {
    super();
    this.direction = direction;
    this.filters = filters || {};
    matches?.forEach(match => this.addMatch(match));
  }

  protected getChildrenNodes(): QueryNode[] {
    return this.matches;
  }

  // eslint-disable-next-line class-methods-use-this
  getProjection() {
    return {
      type: 1,
    } as const;
  }

  getFilters() {
    return { ...this.filters };
  }

  getDirection() {
    return this.direction;
  }

  addMatch(match: MatchQueryNode) {
    this.matches.push(match);
    match.setParent(this);
  }

  getMatches() {
    return this.matches as readonly MatchQueryNode[];
  }

  setParent(parent: MatchQueryNode) {
    this.parent = parent;
  }

  getParent() {
    return this.parent;
  }

  isSame(other: TraversalQueryNode): boolean {
    return (
      this.direction === other.direction &&
      _.isEqual(this.filters, other.filters) &&
      this.matches.length === other.matches.length &&
      this.matches.every((match, index) => match.isSame(other.matches[index]))
    );
  }

  chainsDecomposition(): TraversalQueryNode[] {
    if (!this.matches.length) {
      return [this.shallowClone()];
    }

    const decomposition: TraversalQueryNode[] = [];
    const childrenDecompositions = this.matches.map(match => match.chainsDecomposition());
    childrenDecompositions.forEach(childDecompositions => {
      childDecompositions.forEach(childDecomposition => {
        decomposition.push(this.shallowClone([childDecomposition]));
      });
    });
    return decomposition;
  }

  wouldTraverse(fromEntity: string, relationship: Relationship, toEntity: string) {
    let traverseDirection: 'in' | 'out';
    if (relationship.from.entity === fromEntity && relationship.to.entity === toEntity) {
      traverseDirection = 'out';
    } else if (relationship.to.entity === fromEntity && relationship.from.entity === toEntity) {
      traverseDirection = 'in';
    } else {
      return false;
    }
    return (
      (this.filters.types
        ? this.filters.types.includes(relationship.type)
        : true && this.filters.types) && this.direction === traverseDirection
    );
  }

  inverse(next: MatchQueryNode) {
    this.validateIsChain();
    const inversed = new TraversalQueryNode(
      inverseOfDirection[this.direction],
      {
        ...this.filters,
      },
      [next]
    );
    return this.matches[0].inverse(inversed);
  }

  private sortEntitiesInTraversalOrder(entityData: EntitiesMap, relationship: Relationship) {
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

    const first = entityData[relationship[relSideGivenDirection[this.direction].first].entity];
    const second = entityData[relationship[relSideGivenDirection[this.direction].second].entity];

    return [first, second];
  }

  reachesRelationship(
    relationship: Relationship,
    entityData: EntitiesMap
  ): MatchQueryNode | undefined {
    this.validateIsChain();

    const [toMatchBeforeTraverse, toMatchAfterTraverse] = this.sortEntitiesInTraversalOrder(
      entityData,
      relationship
    );

    const matchesRelationship =
      this.parent!.wouldMatch(toMatchBeforeTraverse) &&
      this.wouldTraverse(
        toMatchBeforeTraverse.sharedId,
        relationship,
        toMatchAfterTraverse.sharedId
      ) &&
      this.matches[0].wouldMatch(toMatchAfterTraverse);

    if (matchesRelationship) {
      return MatchQueryNode.forEntity(toMatchBeforeTraverse, [
        TraversalQueryNode.forRelationship(relationship, this.direction, [
          MatchQueryNode.forEntity(toMatchAfterTraverse),
        ]),
      ]);
    }

    const nextReaches = this.matches[0].reachesRelationship(relationship, entityData);
    if (nextReaches) {
      return this.parent!.shallowClone([this.shallowClone([nextReaches])]);
    }

    return undefined;
  }

  reachesEntity(entity: Entity) {
    this.validateIsChain();

    if (this.matches[0].wouldMatch(entity)) {
      return this.shallowClone([MatchQueryNode.forEntity(entity)]);
    }

    const nextReaches = this.matches[0].reachesEntity(entity);
    if (nextReaches) {
      return this.shallowClone([nextReaches]);
    }
    return undefined;
  }

  shallowClone(matches?: MatchQueryNode[]) {
    return new TraversalQueryNode(this.direction, { ...this.filters }, matches ?? []);
  }

  getTemplates(
    path: number[] = [],
    _records: TemplateRecords | undefined = undefined
  ): TemplateRecords {
    const records = _records || [];
    this.matches.forEach((m, index) => m.getTemplates([...path, index], records));
    return records;
  }

  usesTemplate(templateId: string): boolean {
    return this.matches.some(match => match.usesTemplate(templateId));
  }

  usesType(typeId: string): boolean {
    return (
      this.filters.types?.includes(typeId) || this.matches.some(match => match.usesType(typeId))
    );
  }

  getRelationTypes(
    path: number[] = [],
    _records: TemplateRecords | undefined = undefined
  ): TemplateRecords {
    const records = _records || [];
    records.push({
      path,
      templates: this.filters.types || [],
    });
    this.matches.forEach((m, index) => m.getRelationTypes([...path, index], records));
    return records;
  }

  getTemplatesInLeaves(path: number[] = []): { path: number[]; templates: (string | 'ALL')[] }[] {
    return this.matches.map((m, index) => m.getTemplatesInLeaves([...path, index])).flat();
  }

  static forRelationship(
    relationship: Relationship,
    direction: 'in' | 'out',
    matches?: MatchQueryNode[]
  ) {
    return new TraversalQueryNode(direction, { _id: relationship._id }, matches);
  }
}
