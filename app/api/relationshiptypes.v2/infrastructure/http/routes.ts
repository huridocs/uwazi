import type { Application } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { RelationshipTypeMutationController } from './RelationshipTypeMutationController.js';
import { GetRelationshipTypesController } from './GetRelationshipTypesController.js';
import { DeleteRelationshipTypeController } from './DeleteRelationshipTypeController.js';

const relationshipTypesRoutes = (app: Application) => {
  app.post(
    '/api/relationtypes',
    needsAuthorization(),
    RelationshipTypeMutationController.createHandler()
  );
  app.get('/api/relationtypes', GetRelationshipTypesController.createHandler());
  app.delete(
    '/api/relationtypes',
    needsAuthorization(),
    DeleteRelationshipTypeController.createHandler()
  );
};

export { relationshipTypesRoutes };
