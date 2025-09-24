// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientUserGroupSchema, ClientUserSchema } from '../../apiResponseTypes.js';

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
