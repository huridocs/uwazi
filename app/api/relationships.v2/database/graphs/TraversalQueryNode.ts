import { Relationship } from 'api/relationships.v2/model/Relationship';
import { MatchQueryNode } from './MatchQueryNode';
import { NonChainQueryError } from './NonChainQueryErrror';
import { QueryNode } from './QueryNode';
import { RootQueryNode } from './RootQueryNode';

interface TraversalFilters {
  _id?: string;
  types?: string[];
}

const inverseOfDirection = {
  in: 'out',
  out: 'in',
} as const;

export class TraversalQueryNode extends QueryNode {
  public direction: 'in' | 'out';

  public filters: TraversalFilters;

  private parent?: MatchQueryNode | RootQueryNode;

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

  addMatch(match: MatchQueryNode) {
    this.matches.push(match);
    match.setParent(this);
  }

  getMatches() {
    return this.matches as readonly MatchQueryNode[];
  }

  setParent(parent: MatchQueryNode | RootQueryNode) {
    this.parent = parent;
  }

  getParent() {
    return this.parent;
  }

  chainsDecomposition(): TraversalQueryNode[] {
    if (!this.matches.length) {
      return [new TraversalQueryNode(this.direction, { ...this.filters })];
    }

    const decomposition: TraversalQueryNode[] = [];
    const childrenDecompositions = this.matches.map(match => match.chainsDecomposition());
    childrenDecompositions.forEach(childDecompositions => {
      childDecompositions.forEach(childDecomposition => {
        const newChain = new TraversalQueryNode(this.direction, { ...this.filters }, [
          childDecomposition,
        ]);
        decomposition.push(newChain);
      });
    });
    return decomposition;
  }

  wouldTraverse(fromEntity: string, relationship: Relationship, toEntity: string) {
    let traverseDirection: 'in' | 'out';
    if (relationship.from === fromEntity && relationship.to === toEntity) {
      traverseDirection = 'out';
    } else if (relationship.to === fromEntity && relationship.from === toEntity) {
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
    if (this.matches.length > 1) throw new NonChainQueryError();
    const inversed = new TraversalQueryNode(
      inverseOfDirection[this.direction],
      {
        ...this.filters,
      },
      [next]
    );
    return this.matches[0].inverse(inversed);
  }
}
