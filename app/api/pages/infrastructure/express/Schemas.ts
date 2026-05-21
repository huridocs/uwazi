import { z } from 'zod';

export const PublishPageReleaseSchema = z.object({
  sharedId: z.string().min(1),
  release_message: z.string().trim().min(1),
});

export const RestorePageDraftSchema = z.object({
  sharedId: z.string().min(1),
  version: z.coerce.number().int().min(1),
});

export type PublishPageReleaseRequest = z.infer<typeof PublishPageReleaseSchema>;
export type RestorePageDraftRequest = z.infer<typeof RestorePageDraftSchema>;
