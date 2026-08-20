import type { Application } from 'express';
import { GetRelationshipsSummaryController } from './GetRelationshipsSummaryController.js';
import { GetRelationshipsAnchorsController } from './GetRelationshipsAnchorsController.js';
import { GetRelationshipsResolvedController } from './GetRelationshipsResolvedController.js';

const relationshipsQueryRoutes = (app: Application) => {
  app.get('/api/relationships/summary', GetRelationshipsSummaryController.createHandler());
  app.get('/api/relationships/anchors', GetRelationshipsAnchorsController.createHandler());
  app.get('/api/relationships/resolved', GetRelationshipsResolvedController.createHandler());
};

export { relationshipsQueryRoutes };
