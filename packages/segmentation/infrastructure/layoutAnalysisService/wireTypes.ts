import { z } from 'zod';

/**
 * The segmentation service's own shapes (pdf-document-layout-analysis-async). Nothing outside
 * this folder may use them.
 */

const WireParamsSchema = z.object({
  filename: z.string().min(1),
  idempotency_key: z.string().optional(),
});

const WireResultMessageSchema = z.object({
  tenant: z.string().min(1),
  task: z.string(),
  params: WireParamsSchema.passthrough(),
  success: z.boolean(),
  error_message: z.string().nullish(),
  data_url: z.string().nullish(),
  file_url: z.string().nullish(),
});

const WireSegmentBoxSchema = z.object({
  left: z.number(),
  top: z.number(),
  width: z.number(),
  height: z.number(),
  page_number: z.number(),
  page_width: z.number().optional(),
  page_height: z.number().optional(),
  text: z.string().optional(),
  type: z.string().optional(),
});

const WireExtractionDataSchema = z.object({
  page_width: z.number(),
  page_height: z.number(),
  paragraphs: z.array(WireSegmentBoxSchema),
});

type WireTaskMessage = {
  tenant: string;
  task: 'segmentation';
  params: z.infer<typeof WireParamsSchema>;
};

type WireResultMessage = z.infer<typeof WireResultMessageSchema>;
type WireSegmentBox = z.infer<typeof WireSegmentBoxSchema>;
type WireExtractionData = z.infer<typeof WireExtractionDataSchema>;

/** The outcome handle's fields, as this adapter writes and reads them. */
type WireOutcomeHandle = { dataUrl: string; fileUrl: string };

export { WireResultMessageSchema, WireExtractionDataSchema };
export type {
  WireTaskMessage,
  WireResultMessage,
  WireSegmentBox,
  WireExtractionData,
  WireOutcomeHandle,
};
