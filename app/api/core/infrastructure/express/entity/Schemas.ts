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

const PropertySelectionSchema = z.object({
  propertyID: z.string().optional(),
  name: z.string().optional(),
  timestamp: z.string().optional(),
  deleteSelection: z.boolean().optional(),
  selection: z
    .object({
      text: z.string().optional(),
      selectionRectangles: z
        .array(
          z.object({
            top: z.number(),
            left: z.number(),
            width: z.number(),
            height: z.number(),
            page: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

const EntityIconSchema = z.object({
  _id: z.string().nullable().optional(),
  label: z.string().optional(),
  type: z.string().optional(),
});

const MutateEntitySchema = z.object({
  title: z.string().min(1),
  template: z.string().optional(),
  icon: EntityIconSchema.optional(),
  user: z.string().optional(),
  metadata: MetadataObjectSchema.default({}).optional(),
});

const CreateEntitySchema = MutateEntitySchema.extend({
  attachments: z
    .array(
      z.object({
        originalname: z.string(),
        url: z.string().url().optional(),
      })
    )
    .optional(),
});

const UpdateEntitySchema = MutateEntitySchema.extend({
  _id: z.string(),
  sharedId: z.string(),
  language: z.string().min(2).max(2),
  generatedToc: z.boolean().optional(),
  documents: z
    .array(
      z.object({
        _id: z.string().min(1),
        originalname: z.string().min(1),
      })
    )
    .optional(),
  attachments: z
    .array(
      z.object({
        _id: z.string().min(1).optional(),
        originalname: z.string(),
        url: z.string().url().optional(),
      })
    )
    .optional(),
  propertySelections: z
    .object({
      fileID: z.string().min(1),
      selections: z.array(PropertySelectionSchema),
    })
    .optional(),
});

export { CreateEntitySchema, UpdateEntitySchema };

export type CreateEntityDTO = z.infer<typeof CreateEntitySchema>;
export type UpdateEntityRequest = z.infer<typeof UpdateEntitySchema>;
