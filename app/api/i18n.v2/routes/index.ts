import { Application, Request } from 'express';
import { needsAuthorization } from 'api/auth';
import { validation } from 'api/utils';
import translations from 'api/i18n';
import { getTranslationsEntriesV2 } from 'api/i18n/v2_support';

const translationsRoutes = (app: Application) => {
  app.get('/api/v2/translations', async (_req: Request, res) => {
    const translationsV2 = await getTranslationsEntriesV2();
    const translationList = await translationsV2.all();
    res.json(translationList);
  });

  app.post(
    '/api/v2/translations',
    needsAuthorization(),
    validation.validateRequest({
      type: 'object',
      properties: {
        body: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              language: { type: 'string' },
              key: { type: 'string' },
              value: { type: 'string' },
              context: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['id', 'label', 'type'],
              },
            },
            required: ['language', 'key', 'value', 'context'],
          },
        },
      },
      required: ['body'],
    }),
    async (req, res) => {
      await translations.v2StructureSave(req.body);
      req.sockets.emitToCurrentTenant('translationKeysChange', req.body);
      res.status(200);
      res.json({ success: true });
    }
  );
};

export { translationsRoutes };
