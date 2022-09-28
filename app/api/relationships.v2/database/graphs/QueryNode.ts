import { NonChainQueryError } from './NonChainQueryErrror';

export abstract class QueryNode {
  protected abstract getChildrenNodes(): QueryNode[];

  validateIsChain() {
    if (this.getChildrenNodes().length > 1) {
      throw new NonChainQueryError();
    }
  }

  /**
   * For use only in testing when https://github.com/facebook/jest/issues/10577 is triggered.
   * Undoes the circular references so the differ doesn't fail.
   * @returns this
   */
  __clearParents() {
    // @ts-ignore
    this.parent = undefined;
    this.getChildrenNodes().forEach(node => node.__clearParents());
    return this;
  }
}
