import { User } from '#api/users.v2/model/User.js';

/**
 * Domain value object that answers "who is accessing and what does that mean for permissions?"
 *
 * Pure domain — no MongoDB or Postgres specifics. Translators in the infrastructure
 * layer convert this into DB-specific query filters.
 */
class AccessContext {
  readonly actor: User;

  protected constructor(actor: User) {
    this.actor = actor;
  }

  /** Normal request path — permissions are enforced based on the actor. */
  static forActor(actor: User): AccessContext {
    return new AccessContext(actor);
  }

  /** System processes, migrations, CLI — permissions are bypassed entirely. */
  static system(): AccessContext {
    return new AccessContext(User.system());
  }

  /** Actor can see and edit everything (admin / editor / system). */
  isPrivileged(): boolean {
    return this.actor.isPrivileged();
  }

  /** Actor is not logged in. */
  isAnonymous(): boolean {
    return this.actor.isAnonymous();
  }

  /** The set of refIds representing this actor (user id + group ids). */
  get refIds(): string[] {
    return [this.actor._id, ...this.actor.groups];
  }
}

export { AccessContext };
