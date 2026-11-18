import type { TemplateSchema } from '#shared/types/templateType.js';

/** GET /api/templates */
type TemplatesResponse = { rows: TemplateSchema[] };

export type { TemplatesResponse };
