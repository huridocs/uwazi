import { NonChainQueryError } from './NonChainQueryErrror';

export abstract class QueryNode {
  protected abstract getChildrenNodes(): QueryNode[];

  validateIsChain() {
    if (this.getChildrenNodes().length > 1) {
      throw new NonChainQueryError();
    }
  }
}
