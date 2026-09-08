import { z } from 'zod';
import type { PageType } from '#shared/types/pageType.js';

const PublishPageReleaseSchema = z.object({
  sharedId: z.string().min(1),
  release_message: z.string().trim().min(1),
});

const RestorePageDraftSchema = z.object({
  sharedId: z.string().min(1),
  version: z.coerce.number().int().min(1),
});

const ListPagesSchema = z.object({
  sharedId: z.string().optional(),
});

const GetPageSchema = z.object({
  sharedId: z.string().min(1),
  mode: z.enum(['editor']).optional(),
});

const DeletePageSchema = z.object({
  sharedId: z.string().optional(),
});

type PublishPageReleaseRequest = z.infer<typeof PublishPageReleaseSchema>;
type RestorePageDraftRequest = z.infer<typeof RestorePageDraftSchema>;
type ListPagesRequest = z.infer<typeof ListPagesSchema>;
type GetPageRequest = z.infer<typeof GetPageSchema>;
type DeletePageRequest = z.infer<typeof DeletePageSchema>;

/** Create (no sharedId) and update (sharedId present) share one endpoint, POST /api/pages. */
type CreatePageRequest = PageType;
type UpdatePageRequest = PageType & { sharedId: string };
type SavePageResponse = PageType;

type GetPageResponse = PageType;
type ListPagesResponse = PageType[];
type DeletePageResponse = { ok: true };
type PublishPageReleaseResponse = PageType & { version: number };
type RestorePageDraftResponse = PageType;

export {
  PublishPageReleaseSchema,
  RestorePageDraftSchema,
  ListPagesSchema,
  GetPageSchema,
  DeletePageSchema,
};
export type {
  PublishPageReleaseRequest,
  RestorePageDraftRequest,
  ListPagesRequest,
  GetPageRequest,
  DeletePageRequest,
  CreatePageRequest,
  UpdatePageRequest,
  SavePageResponse,
  GetPageResponse,
  ListPagesResponse,
  DeletePageResponse,
  PublishPageReleaseResponse,
  RestorePageDraftResponse,
};
