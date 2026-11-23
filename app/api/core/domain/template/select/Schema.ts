import { z } from 'zod';
import { attributesSchema, entryCarriesAttributes } from '../attributesSchema.js';
import { PropertyType } from '../PropertyType.js';

const EntrySchema = z
  .object({
    value: z.string(),
    label: z.string(),
    attributes: attributesSchema,
    parent: z
      .object({
        value: z.string().min(1, 'Parent value must be a non-empty string.'),
        label: z.string().min(1, 'Parent label must be provided.'),
      })
      .optional(),
  })
  .superRefine((entry, ctx) => {
    if (entryCarriesAttributes(entry)) {
      return;
    }
    if (!entry.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select/MultiSelect value must be a non-empty string.',
        path: ['value'],
      });
    }
    if (!entry.label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select/MultiSelect label must be provided.',
        path: ['label'],
      });
    }
  });

export const createSchema = (isRequired: boolean, type: PropertyType) =>
  z.object({
    language: z.string().min(1, 'Language must be provided.'),
    value: z
      .array(EntrySchema)
      .min(isRequired ? 1 : 0, 'Select/MultiSelect Property is required')
      .max(
        type === 'select' ? 1 : Infinity,
        'Select/MultiSelect Property only accepts a single value.'
      ),
  });
