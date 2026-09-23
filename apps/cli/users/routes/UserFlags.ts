import type { Options } from 'yargs';
import { UserRole } from '#api/core/domain/user/User.js';

const ROLES = Object.values(UserRole).join(', ');

/** Flags shared by the users routes, so every command describes them the same way. */
class UserFlags {
  static readonly email = { type: 'string', describe: 'Email address' } satisfies Options;

  static readonly role = { type: 'string', describe: `Role: ${ROLES}` } satisfies Options;

  static readonly groups = {
    type: 'array',
    string: true,
    describe: 'User group ids (none given: no groups)',
  } satisfies Options;
}

export { UserFlags };
