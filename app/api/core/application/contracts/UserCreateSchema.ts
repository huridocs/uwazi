import { z } from 'zod';

const UserCreateSchema = z.object({
  username: z.string().trim(),
  role: z.enum(['admin', 'editor', 'collaborator']),
  email: z.string().email(),
  groups: z.array(z.object({ _id: z.string(), name: z.string() })).optional(),
  password: z.string().optional(),
});

export { UserCreateSchema };
export type CreateUserDTO = z.infer<typeof UserCreateSchema>;
