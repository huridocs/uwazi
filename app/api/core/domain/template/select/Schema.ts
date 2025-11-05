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
