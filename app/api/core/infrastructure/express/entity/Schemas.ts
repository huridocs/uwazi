import { z } from 'zod';

const LinkSchema = z.object({
  label: z.string().optional(),
  url: z.string().optional(),
});

const DateRangeSchema = z.object({
  from: z.number().optional(),
  to: z.number().optional(),
});

const GeolocationSchema = z.object({
  label: z.string().optional(),
  lat: z.number(),
  lon: z.number(),
});

const PropertyValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  LinkSchema,
  DateRangeSchema,
  GeolocationSchema,
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
  _id: z.string().optional(),
  label: z.string().optional(),
  type: z.string().optional(),
});

const CreateEntitySchema = z.object({
  title: z.string().min(1),
  template: z.string().optional(),
  icon: EntityIconSchema.optional(),
  user: z.string().optional(),
  metadata: MetadataObjectSchema.default({}).optional(),
});

export { CreateEntitySchema };

export type CreateEntityDTO = z.infer<typeof CreateEntitySchema>;
