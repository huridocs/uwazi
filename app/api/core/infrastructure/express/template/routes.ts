import type { Application } from 'express';
import { TemplateMutationController } from './TemplateMutationController.js';
import { SetTemplateAsDefaultController } from './SetTemplateAsDefaultController/SetTemplateAsDefaultController.js';
import { GetTemplatesController } from './GetTemplatesController.js';
import { DeleteTemplateController } from './DeleteTemplateController/DeleteTemplateController.js';
import { CountTemplatesByThesaurusController } from './CountTemplatesByThesaurusController.js';
import needsAuthorization from '../../../../auth/authMiddleware.js';

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
