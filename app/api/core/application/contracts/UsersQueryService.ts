import type { UserProfile } from './UserReadModels.js';

/**
 * "What does the users settings screen render" — the read door for HTTP controllers and
 * SSR loaders (D1/D3 in plans/users-refactor-00-decisions.md).
 *
 * One method is the right size. This contract owns *the settings-screen read*, and that is
 * where pagination, sorting and filtering will land — which is what the old, unused `query`
 * parameter was reaching for without a shape. The other two methods it used to carry,
 * `listBasicInfo` and `findByEmailOrUsername`, moved to `UsersDirectory`: `search.js` and
 * `collaborators.ts` are internal modules composing their own shapes, not HTTP responses.
 *
 * `listUsers` takes no filter argument. Both call sites passed `{}`, and the parameter was a
 * backend-specific filter type leaking through a public signature.
 */
interface UsersQueryService {
  listUsers(): Promise<UserProfile[]>;
}

export type { UsersQueryService };
