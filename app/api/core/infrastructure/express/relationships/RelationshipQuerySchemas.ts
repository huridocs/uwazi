import { z } from 'zod';

const SharedIdQuerySchema = z.object({
  sharedId: z.string().min(1),
});

const AnchorsQuerySchema = SharedIdQuerySchema.extend({
  file: z.string().min(1),
});

export { SharedIdQuerySchema, AnchorsQuerySchema };
