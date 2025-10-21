import { z } from 'zod';

export const DeleteTemplateSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

export type DeleteTemplateRequestDto = z.infer<typeof DeleteTemplateSchema>;

export type DeleteTemplateResponseDto = { _id: string };
