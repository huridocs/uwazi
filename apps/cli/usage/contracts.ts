import { z } from 'zod';

const KindUsageSchema = z.object({ count: z.number(), size: z.number() });

const UsageReportOutputSchema = z.object({
  entitiesCount: z.number(),
  filesCount: z.object({
    document: z.number(),
    attachment: z.number(),
    custom: z.number(),
    thumbnail: z.number(),
  }),
  filesByBucket: z.object({
    pdf: KindUsageSchema,
    image: KindUsageSchema,
    video: KindUsageSchema,
    audio: KindUsageSchema,
    office: KindUsageSchema,
    text: KindUsageSchema,
    other: KindUsageSchema,
    unknown: KindUsageSchema,
  }),
  filesStorage: z.number(),
  dbStorage: z.number(),
  dbStorageByEngine: z.object({ mongo: z.number(), postgres: z.number() }),
  elasticStorage: z.number(),
  lastSession: z.number().nullable(),
});

type UsageReportOutput = z.infer<typeof UsageReportOutputSchema>;

export { UsageReportOutputSchema };
export type { UsageReportOutput };
