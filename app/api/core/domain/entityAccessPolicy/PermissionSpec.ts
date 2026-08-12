import { AccessContext } from './AccessContext.js';
import { AccessLevel } from './AccessLevel.js';
import { User } from '#api/users.v2/model/User.js';

/**
 * A permission specification that extends an AccessContext with an intent level
 * (Read or Write). Used by the application layer to ask "can this actor read/write
 * these specific entities?" before or after collection-level enforcement.
 */
class PermissionSpec extends AccessContext {
  readonly level: AccessLevel;

  constructor(actor: User, level: AccessLevel) {
    super(actor);
    this.level = level;
  }

  get isWriteLevel(): boolean {
    return this.level === AccessLevel.Write;
  }

  isSatisfiedBy(level: AccessLevel): boolean {
    return this.level === level;
  }

  static createWriteSpecification(actor: User): PermissionSpec {
    return new PermissionSpec(actor, AccessLevel.Write);
  }

  static createDeleteSpecification(actor: User): PermissionSpec {
    return new PermissionSpec(actor, AccessLevel.Write);
  }
}

export { PermissionSpec };
