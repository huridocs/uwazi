import { z } from 'zod';

/**
 * The OCR service's own shapes (pdf-document-layout-analysis-async). Nothing outside this folder
 * may use them.
 */

const WireParamsSchema = z.object({
  filename: z.string().min(1),
  language: z.string().optional(),
  metadata: z.object({ key: z.string().optional() }).passthrough().optional(),
});

const WireResultMessageSchema = z.object({
  tenant: z.string().min(1),
  task: z.string(),
  params: WireParamsSchema.passthrough(),
  success: z.boolean(),
  error_message: z.string().nullish(),
  file_url: z.string().nullish(),
});

const WireInfoSchema = z.object({ supported_languages: z.array(z.string()) });

type WireTaskMessage = {
  tenant: string;
  task: 'ocr';
  params: { filename: string; language: string; metadata: { key: string } };
};

type WireResultMessage = z.infer<typeof WireResultMessageSchema>;

/** The outcome handle's fields, as this adapter writes and reads them. */
type WireOutcomeHandle = { fileUrl: string };

export { WireResultMessageSchema, WireInfoSchema };
export type { WireTaskMessage, WireResultMessage, WireOutcomeHandle };
