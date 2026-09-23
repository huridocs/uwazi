import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';

/**
 * What `uwazi users …` prints with --json. Owned by the CLI, not shared with the HTTP API: the
 * manager depends on these shapes, so fields are only ever added.
 */
const UserOutputSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.nativeEnum(UserRole),
});

const UserListItemSchema = UserOutputSchema.extend({
  groups: z.array(z.object({ id: z.string(), name: z.string() })),
  using2fa: z.boolean(),
  accountLocked: z.boolean(),
});

const CreatedUserOutputSchema = z.object({
  user: UserOutputSchema,
  welcomeEmailQueued: z.boolean(),
});

const UpdatedUserOutputSchema = z.object({ user: UserOutputSchema });

const DeletedUserOutputSchema = z.object({ id: z.string() });

const RoleCountsOutputSchema = z.object({
  admin: z.number(),
  editor: z.number(),
  collaborator: z.number(),
  total: z.number(),
});

type UserOutput = z.infer<typeof UserOutputSchema>;
type UserListItem = z.infer<typeof UserListItemSchema>;
type CreatedUserOutput = z.infer<typeof CreatedUserOutputSchema>;
type UpdatedUserOutput = z.infer<typeof UpdatedUserOutputSchema>;
type DeletedUserOutput = z.infer<typeof DeletedUserOutputSchema>;
type RoleCountsOutput = z.infer<typeof RoleCountsOutputSchema>;

export {
  UserOutputSchema,
  UserListItemSchema,
  CreatedUserOutputSchema,
  UpdatedUserOutputSchema,
  DeletedUserOutputSchema,
  RoleCountsOutputSchema,
};
export type {
  UserOutput,
  UserListItem,
  CreatedUserOutput,
  UpdatedUserOutput,
  DeletedUserOutput,
  RoleCountsOutput,
};
