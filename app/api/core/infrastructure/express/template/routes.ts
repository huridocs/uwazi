import { Application } from 'express';
import { TemplateMutationController } from '#api/core/infrastructure/express/template/TemplateMutationController.js';
import { SetTemplateAsDefaultController } from '#api/core/infrastructure/express/template/SetTemplateAsDefaultController/SetTemplateAsDefaultController.js';
import { GetTemplatesController } from '#api/core/infrastructure/express/template/GetTemplatesController.js';
import { DeleteTemplateController } from '#api/core/infrastructure/express/template/DeleteTemplateController/DeleteTemplateController.js';
import { CountTemplatesByThesaurusController } from '#api/core/infrastructure/express/template/CountTemplatesByThesaurusController.js';
import needsAuthorization from '#api/auth/authMiddleware.js';

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
