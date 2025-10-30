import { z } from 'zod';
import { PropertyType } from '../PropertyType';

const EntrySchema = z.object({
  value: z.string().min(1, 'Select/MultiSelect value must be a non-empty string.'),
  label: z.string().min(1, 'Select/MultiSelect label must be provided.'),
  parent: z
    .object({
      value: z.string().min(1, 'Parent value must be a non-empty string.'),
      label: z.string().min(1, 'Parent label must be provided.'),
    })
    .optional(),
});

export const createSchema = (required: boolean, type: PropertyType) =>
  z.object({
    language: z.string().min(1, 'Language must be provided.'),
    value: z.array(EntrySchema).superRefine((arr, ctx) => {
      if (type === 'select' && arr.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select/MultiSelect Property only accepts a single value.',
          path: ['value'],
        });
      }

      if (required && arr.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select/MultiSelect Property is required',
          path: ['value'],
        });
      }
    }),
  });
