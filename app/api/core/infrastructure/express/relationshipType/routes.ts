import type { Application, NextFunction, Request, Response } from 'express';
import needsAuthorization from '#api/auth/authMiddleware.js';
import { CreateRelationshipTypeController } from './CreateRelationshipTypeController.js';
import { GetRelationshipTypesController } from './GetRelationshipTypesController.js';
import { DeleteRelationshipTypeController } from './DeleteRelationshipTypeController.js';
import { UpdateRelationshipTypeController } from './UpdateRelationshipTypeController.js';

const relationshipTypesRoutes = (app: Application) => {
  app.post(
    '/api/relationtypes',
    needsAuthorization(),
    async (req: Request, res: Response, _next: NextFunction) => {
      if (req.body?._id) {
        return UpdateRelationshipTypeController.createHandler()(req, res);
      }

      return CreateRelationshipTypeController.createHandler()(req, res);
    }
  );
  app.get('/api/relationtypes', GetRelationshipTypesController.createHandler());
  app.delete(
    '/api/relationtypes',
    needsAuthorization(),
    DeleteRelationshipTypeController.createHandler()
  );
};

export { relationshipTypesRoutes };
