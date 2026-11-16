import { z } from 'zod';
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { ValidateRequest } from '#api/core/infrastructure/express/decorators/ValidateRequest.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { LanguageISO6391Schema } from '#shared/types/commonSchemas.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

const RequestSchema = {
  type: 'object',
  properties: {
    query: {
      type: 'object',
      properties: {
        context: { type: 'string' },
        locale: LanguageISO6391Schema,
      },
    },
  },
};

const QuerySchema = z.object({
  context: z.string().optional(),
  locale: z.string().optional(),
});

class GetTranslationsController extends AbstractController {
  @ValidateRequest(RequestSchema)
  protected async handle(): Promise<void> {
    const query = QuerySchema.parse(this.request.query);
    const service = TranslationsQueryServiceFactory.default();
    const rows = await service.getLegacy({
      context: query.context,
      locale: query.locale as LanguageISO6391 | undefined,
    });
    this.response.json({ rows });
  }
}

export { GetTranslationsController };
