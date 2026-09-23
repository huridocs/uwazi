import { z } from 'zod';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';

type UserReferenceInput = { username?: string; id?: string };

/** How a command names an existing user: exactly one of --username or --id. */
class UserReference {
  static readonly shape = {
    username: z.string().min(1).optional(),
    id: z
      .string()
      .regex(/^[0-9a-f]{24}$/i, 'Must be a 24-character hex id')
      .optional(),
  };

  static readonly flags = {
    username: { type: 'string', describe: 'Username of the user' },
    id: { type: 'string', describe: 'Id of the user' },
  } as const;

  static refine(input: UserReferenceInput, ctx: z.RefinementCtx): void {
    if (Boolean(input.username) === Boolean(input.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['user'],
        message: 'Provide exactly one of --username or --id',
      });
    }
  }

  /** Must run inside the tenant: only active users are found. */
  static async resolveId({ username, id }: UserReferenceInput): Promise<string> {
    if (id) {
      return id;
    }

    const user = await UsersQueryServiceFactory.default().findByUsername(username ?? '');
    if (!user) {
      throw new UserNotFound(username ?? '');
    }

    return user._id;
  }
}

export { UserReference };
export type { UserReferenceInput };
