import { AccessGrant, AccessGrantProps } from './AccessGrant.js';
import { DuplicateGrantError } from './errors.js';

class AccessGrantSet {
  private readonly grants: AccessGrant[];

  private constructor(grants: AccessGrant[]) {
    this.grants = grants;
  }

  static create(props: AccessGrantProps[]): AccessGrantSet {
    const grants = props.map(p => new AccessGrant(p));
    const refIds = grants.map(g => g.refId);
    if (new Set(refIds).size !== refIds.length) {
      throw new DuplicateGrantError();
    }
    return new AccessGrantSet(grants);
  }

  static empty(): AccessGrantSet {
    return new AccessGrantSet([]);
  }

  get items(): AccessGrant[] {
    return [...this.grants];
  }

  get size(): number {
    return this.grants.length;
  }
}

export { AccessGrantSet };
