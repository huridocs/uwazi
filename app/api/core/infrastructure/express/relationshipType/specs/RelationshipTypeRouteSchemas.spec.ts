import { z } from 'zod';
import {
  deleteRelationshipTypeQuerySchema,
  getRelationshipTypesQuerySchema,
  upsertRelationshipTypeRequestSchema,
} from '../RelationshipTypeRouteSchemas.js';

describe('RelationshipTypeRouteSchemas', () => {
  describe('upsertRelationshipTypeRequestSchema', () => {
    it('should parse create payload', () => {
      const parsed = upsertRelationshipTypeRequestSchema.parse({ name: 'Related To' });

      expect(parsed).toMatchObject({ name: 'Related To' });
    });

    it('should parse update payload with compatibility properties field', () => {
      const parsed = upsertRelationshipTypeRequestSchema.parse({
        _id: 'rel-id',
        name: 'Updated Name',
        properties: [{ label: 'legacy' }],
      });

      expect(parsed).toMatchObject({
        _id: 'rel-id',
        name: 'Updated Name',
      });
      expect(parsed.properties).toHaveLength(1);
    });

    it('should reject invalid payload', () => {
      expect(() => upsertRelationshipTypeRequestSchema.parse({ _id: 1, name: 22 })).toThrow(
        z.ZodError
      );
    });
  });

  describe('getRelationshipTypesQuerySchema', () => {
    it('should parse optional id', () => {
      expect(getRelationshipTypesQuerySchema.parse({})).toEqual({});
      expect(getRelationshipTypesQuerySchema.parse({ _id: 'id' })).toEqual({ _id: 'id' });
    });
  });

  describe('deleteRelationshipTypeQuerySchema', () => {
    it('should require id', () => {
      expect(deleteRelationshipTypeQuerySchema.parse({ _id: 'id' })).toEqual({ _id: 'id' });
      expect(() => deleteRelationshipTypeQuerySchema.parse({})).toThrow(z.ZodError);
    });
  });
});
