import { Application } from 'express';
import { inspect } from 'util';
import { TemplateMutationController } from 'api/core/infrastructure/express/template/TemplateMutationController';
import { SetTemplateAsDefaultController } from 'api/core/infrastructure/express/template/SetTemplateAsDefaultController';
import { GetTemplatesController } from 'api/core/infrastructure/express/template/GetTemplatesController';
import { DeleteTemplateController } from 'api/core/infrastructure/express/template/DeleteTemplateController';
import { CountTemplatesByThesaurusController } from 'api/core/infrastructure/express/template/CountTemplatesByThesaurusController';
import needsAuthorization from '../auth/authMiddleware';
import { createError } from '../utils';

export const handleMappingConflict = async <T>(callback: () => Promise<T>) => {
  try {
    return await callback();
  } catch (e: any) {
    if (e.meta?.body?.error?.reason?.match(/mapp[ing|er]/)) {
      throw createError(`mapping conflict: ${inspect(e)}`, 409);
    }
    throw e;
  }
};

export default (app: Application) => {
  app.get('/api/templates', GetTemplatesController.createHandler());
  app.get('/api/templates/count_by_thesauri', CountTemplatesByThesaurusController.createHandler());

  app.post('/api/templates', needsAuthorization(), TemplateMutationController.createHandler());
  app.post(
    '/api/templates/setasdefault',
    needsAuthorization(),
    SetTemplateAsDefaultController.createHandler()
  );

  app.delete('/api/templates', needsAuthorization(), DeleteTemplateController.createHandler());
};
