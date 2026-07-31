import { z } from 'zod';

const upsertRelationshipTypeRequestSchema = z
  .object({
    _id: z.string().optional(),
    __v: z.number().optional(),
    name: z.string(),
  })
  .passthrough();

const getRelationshipTypesQuerySchema = z.object({
  _id: z.string().optional(),
});

const deleteRelationshipTypeQuerySchema = z.object({
  _id: z.string(),
});

export {
  upsertRelationshipTypeRequestSchema,
  getRelationshipTypesQuerySchema,
  deleteRelationshipTypeQuerySchema,
};
