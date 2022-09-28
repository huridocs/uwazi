import { NonChainQueryError } from './NonChainQueryErrror';

export abstract class QueryNode {
  protected abstract getChildrenNodes(): QueryNode[];

  abstract getProjection(): Record<string, 1 | {}>;

  protected projectAndArrangeTraversals() {
    const traversalFields = [];
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < this.getChildrenNodes().length; index++) {
      traversalFields.push(`$traversal-${index}`);
    }

    return [
      {
        $project: { ...this.getProjection(), traversal: { $concatArrays: traversalFields } },
      },
    ];
  }

  validateIsChain() {
    if (this.getChildrenNodes().length > 1) {
      throw new NonChainQueryError();
    }
  }

  protected unwind() {
    return this.getChildrenNodes().length ? [{ $unwind: '$traversal' }] : [{ $unset: 'traversal' }];
  }

  abstract chainsDecomposition(): QueryNode[];

  __clearParents() {
    // @ts-ignore
    this.parent = undefined;
    this.getChildrenNodes().forEach(node => node.__clearParents());
    return this;
  }
}
