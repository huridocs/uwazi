import { z } from 'zod';

const relationshipTypePropertySchema = z
  .object({
    _id: z.string().optional(),
    __v: z.number().optional(),
    localID: z.string().optional(),
    id: z.string().optional(),
    label: z.string().optional(),
    type: z.string().optional(),
    content: z.string().optional(),
    name: z.string().optional(),
    filter: z.boolean().optional(),
    sortable: z.boolean().optional(),
    showInCard: z.boolean().optional(),
    prioritySorting: z.boolean().optional(),
    nestedProperties: z.array(z.string()).optional(),
  })
  .passthrough();

const upsertRelationshipTypeRequestSchema = z
  .object({
    _id: z.string().optional(),
    __v: z.number().optional(),
    name: z.string(),
    properties: z.array(relationshipTypePropertySchema).optional(),
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
