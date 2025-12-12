import { z } from 'zod';

const LinkSchema = z.object({
  label: z.string().optional(),
  url: z.string().optional(),
});

const DateRangeSchema = z.object({
  from: z.number().nullable(),
  to: z.number().nullable(),
});

const GeolocationSchema = z.object({
  label: z.string(),
  lat: z.number(),
  lon: z.number(),
});

const PropertyValueSchema = z.union([
  DateRangeSchema,
  GeolocationSchema,
  LinkSchema,
  z.string(),
  z.null(),
  z.number(),
  z.boolean(),
]);

const SelectParentSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const InheritedValueSchema = z.object({
  value: PropertyValueSchema,
  label: z.string().optional(),
  parent: SelectParentSchema.optional(),
});

const MetadataValueSchema = z.object({
  value: PropertyValueSchema,
  attachment: z.number().optional(),
  label: z.string().optional(),
  suggestion_model: z.string().optional(),
  provenance: z.string().optional(),
  inheritedValue: z.array(InheritedValueSchema).optional(),
  inheritedType: z.string().optional(),
  timeLinks: z.string().optional(),
  parent: SelectParentSchema.optional(),
});

const MetadataObjectSchema = z.record(z.array(MetadataValueSchema));

const EntityIconSchema = z.object({
  _id: z.string().nullable().optional(),
  label: z.string().optional(),
  type: z.string().optional(),
});

const CreateEntitySchema = z.object({
  title: z.string().min(1),
  template: z.string().optional(),
  icon: EntityIconSchema.optional(),
  user: z.string().optional(),
  metadata: MetadataObjectSchema.default({}).optional(),
  attachments: z
    .array(
      z.object({
        originalname: z.string(),
        url: z.string().url().optional(),
      })
    )
    .optional(),
});

export { CreateEntitySchema };

export type CreateEntityDTO = z.infer<typeof CreateEntitySchema>;
