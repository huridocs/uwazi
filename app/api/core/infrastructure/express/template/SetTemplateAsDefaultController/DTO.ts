import { TemplateDBO } from 'api/core/infrastructure/mongodb/template/DBOs/TemplateDBO';
import { z } from 'zod';

export const SetTemplateAsDefaultSchema = z.object({
  _id: z.string({ message: 'You should provide an Id' }),
});

export type SetTemplateAsDefaultRequestDto = z.infer<typeof SetTemplateAsDefaultSchema>;

export type SetTemplateAsDefaultResponseDto = TemplateDBO;
