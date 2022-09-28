import { NonChainQueryError } from './NonChainQueryErrror';

export abstract class QueryNode {
  protected abstract getChildrenNodes(): QueryNode[];

  validateIsChain() {
    if (this.getChildrenNodes().length > 1) {
      throw new NonChainQueryError();
    }
  }

  __clearParents() {
    // @ts-ignore
    this.parent = undefined;
    this.getChildrenNodes().forEach(node => node.__clearParents());
    return this;
  }
}
