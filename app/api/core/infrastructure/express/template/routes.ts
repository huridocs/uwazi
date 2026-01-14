import { Application } from 'express';
import { TemplateMutationController } from 'api/core/infrastructure/express/template/TemplateMutationController';
import { SetTemplateAsDefaultController } from 'api/core/infrastructure/express/template/SetTemplateAsDefaultController/SetTemplateAsDefaultController';
import { GetTemplatesController } from 'api/core/infrastructure/express/template/GetTemplatesController';
import { DeleteTemplateController } from 'api/core/infrastructure/express/template/DeleteTemplateController/DeleteTemplateController';
import { CountTemplatesByThesaurusController } from 'api/core/infrastructure/express/template/CountTemplatesByThesaurusController';
import needsAuthorization from '../../../../auth/authMiddleware';

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
