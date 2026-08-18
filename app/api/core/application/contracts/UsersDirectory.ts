import type { ResultType } from '#api/core/libs/Result.js';
import type { UserNotFound } from '#api/core/domain/user/errors.js';
import type { UserView, UserProfile } from './UserReadModels.js';

/**
 * "Who is user X, so I can act on their behalf or name them" — the read door for any
 * internal module (D1/D3 in plans/users-refactor-00-decisions.md).
 *
 * It is one of three components that answer a `getById`-shaped question, and that is CQRS
 * rather than duplication: `UsersDataSource` loads an aggregate you intend to *change*,
 * this projects rows to read models nobody may mutate, and `UsersQueryService` answers a
 * single screen. Do not consolidate them.
 *
 * `ResultType` on the single-user lookups because absence is a distinct outcome worth
 * handling; plain arrays on the collection methods because empty is not a failure and
 * wrapping it forces every caller to unwrap something that cannot fail.
 *
 * No method takes a filter. If a call site turns out to need one, amend D3 rather than
 * reintroducing an untyped `Record<string, unknown>` — that parameter is exactly how the
 * backend query languages leaked through the old public signatures.
 */
interface UsersDirectory {
  getById(id: string): Promise<ResultType<UserView, UserNotFound>>;
  getProfile(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  /**
   * **The only method that resolves soft-deleted users** (D3/D9). Four call sites need
   * this deliberately — actor attribution on historical records — and keeping it to one
   * named method makes those call sites self-documenting while stopping every other path
   * from opting in.
   *
   * It returns `UserProfile` rather than `UserView` because `setupQueueWorker.ts` feeds the
   * result to `User.createFrom`, whose `groups` field drives permission checks: an actor
   * resolved without groups silently *loses* access inside jobs, with no error. The
   * attribution call sites ignore the extra fields.
   */
  getActor(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  getManyByIds(ids: string[]): Promise<UserView[]>;
  /** Case-insensitive exact match on either field. Not a prefix search. */
  searchByUsernameOrEmail(term: string): Promise<UserView[]>;
  list(): Promise<UserView[]>;
}

export type { UsersDirectory };
