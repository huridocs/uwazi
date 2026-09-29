import { z } from 'zod';

type UserReferenceInput = { username?: string; id?: string };

/** How a request names an existing user: exactly one of `username` or `id`. */
class UserReference {
  static readonly shape = {
    username: z.string().min(1).optional(),
    id: z
      .string()
      .regex(/^[0-9a-f]{24}$/i, 'Must be a 24-character hex id')
      .optional(),
  };

  static refine(input: UserReferenceInput, ctx: z.RefinementCtx): void {
    if (Boolean(input.username) === Boolean(input.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['user'],
        message: 'Provide exactly one of username or id',
      });
    }
  }
}

export { UserReference };
export type { UserReferenceInput };
