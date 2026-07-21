import { z } from 'zod';

const looseObject = z.object({}).passthrough();

const datavizSourceSchema = z.object({ templateId: z.string().min(1) }).passthrough();

const datavizQuerySchema = z
  .object({
    sources: z.array(datavizSourceSchema).min(1),
    dimensions: z.array(looseObject),
    measures: z.array(looseObject).min(1, 'At least one measure is required'),
  })
  .passthrough();

const datavizDefinitionBodySchema = z.object({
  name: z.string().trim().min(1, 'Dataviz name is required'),
  description: z.string().optional(),
  dataSource: z.string().optional(),
  query: datavizQuerySchema,
  manualData: looseObject.optional(),
  chart: z.object({ type: z.string() }).passthrough(),
  appearance: z.object({ colorMode: z.string() }).passthrough(),
  refresh: z.object({ refreshMode: z.string() }).passthrough(),
  embedPublic: z.boolean().optional(),
});

const createDatavizInputSchema = datavizDefinitionBodySchema;

const updateDatavizInputSchema = datavizDefinitionBodySchema.extend({
  id: z.string().min(1),
});

export {
  createDatavizInputSchema,
  updateDatavizInputSchema,
  datavizQuerySchema,
  datavizDefinitionBodySchema,
};
