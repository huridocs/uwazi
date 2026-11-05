import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import { CreateUserUseCaseFactory } from '#api/core/infrastructure/factories/CreateUserUseCaseFactory.js';
import { DeleteUsersUseCaseFactory } from '#api/core/infrastructure/factories/DeleteUsersUseCaseFactory.js';
import { UpdateUserUseCaseFactory } from '#api/core/infrastructure/factories/UpdateUserUseCaseFactory.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const usersListTool = defineTool({
  name: 'users_list',
  domain: 'users',
  sideEffect: 'read',
  adminOnly: true,
  description: 'List users and their groups. Admin only.',
  parameters: z.object({}),
  execute: async () => toJsonSafe({ rows: await UsersQueryServiceFactory.default().listUsers() }),
});

const usersCreateTool = defineTool({
  name: 'users_create',
  domain: 'users',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Create a user. Admin only. Sends a welcome email unless sendWelcomeEmail is false.',
  parameters: z.object({
    username: z.string().min(1),
    email: z.string().min(1),
    role: z.nativeEnum(UserRole),
    password: z.string().min(1).optional(),
    assignedGroupIds: z.array(z.string()).optional(),
    sendWelcomeEmail: z.boolean().optional(),
  }),
  execute: async (args, ctx) => {
    const domain = `${ctx.protocol}://${ctx.instanceHost || ExecutionContext.tenant.domain}`;
    const user = await CreateUserUseCaseFactory.default().execute({
      ...args,
      assignedGroupIds: args.assignedGroupIds ?? [],
      sendWelcomeEmail: args.sendWelcomeEmail ?? true,
      domain,
    });
    return toJsonSafe({
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  },
});

const usersUpdateTool = defineTool({
  name: 'users_update',
  domain: 'users',
  sideEffect: 'write',
  description:
    'Update a user. Non-admins may only update themselves and cannot change their own role.',
  parameters: z.object({
    _id: z.string().min(1),
    username: z.string().optional(),
    email: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    password: z.string().min(1).optional(),
    assignedGroupIds: z.array(z.string()).optional(),
  }),
  execute: async args => {
    const user = await UpdateUserUseCaseFactory.default().execute(args);
    return toJsonSafe({
      _id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
    });
  },
});

const usersDeleteTool = defineTool({
  name: 'users_delete',
  domain: 'users',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Delete users by id. Admin only.',
  parameters: z.object({
    ids: z.array(z.string().min(1)).min(1),
  }),
  execute: async args => {
    const deletedCount = await DeleteUsersUseCaseFactory.default().execute(args);
    return { deletedCount };
  },
});

export { usersCreateTool, usersDeleteTool, usersListTool, usersUpdateTool };
