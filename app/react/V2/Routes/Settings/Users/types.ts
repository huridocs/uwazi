import { ClientUserGroupSchema, ClientUserSchema } from 'app/apiResponseTypes';

type FormIntent =
  | 'new-user'
  | 'edit-user'
  | 'delete-users'
  | 'new-group'
  | 'edit-group'
  | 'delete-groups'
  | 'unlock-user'
  | 'reset-password'
  | 'reset-2fa'
  | 'bulk-reset-2fa'
  | 'bulk-reset-password';

type User = ClientUserSchema & { rowId: string };
type Group = ClientUserGroupSchema & { rowId: string };

export type { FormIntent, User, Group };
