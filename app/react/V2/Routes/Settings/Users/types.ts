import { ClientUserGroupSchema, ClientUserSchema } from '#app/apiResponseTypes.js';

type User = ClientUserSchema & { rowId: string };
type Group = ClientUserGroupSchema & { rowId: string };

export type { User, Group };
