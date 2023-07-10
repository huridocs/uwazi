import { performance } from 'perf_hooks';

import { Application, NextFunction, Request, Response } from 'express';

import { needsAuthorization } from 'api/auth';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { getClient } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { parseQuery } from 'api/utils';
import {
  CreateRelationshipService,
  DeleteRelationshipMigrationFieldService,
  DeleteRelationshipService,
  GetRelationshipMigrationFieldsService,
  GetRelationshipService,
  MigrationService,
  UpsertRelationshipMigrationFieldService,
} from '../services/service_factories';
import { validateCreateRelationship } from './validators/createRelationship';
import { validateDeleteRelationships } from './validators/deleteRelationships';
import { validateGetRelationships } from './validators/getRelationship';
import { validateMigration } from './validators/migration';
import { validateDeleteRelationshipMigrationField } from './validators/deleteRelationshipMigrationFields';
import { validateUpsertRelationshipMigrationField } from './validators/upsertRelationshipMigrationFields';

const featureRequired = async (_req: Request, res: Response, next: NextFunction) => {
  if (
    !(await DefaultSettingsDataSource(
      new MongoTransactionManager(getClient())
    ).readNewRelationshipsAllowed())
  ) {
    return res.sendStatus(404);
  }
  return next();
};

export default (app: Application) => {
  app.get('/api/v2/relationships', featureRequired, async (req, res) => {
    const { sharedId } = validateGetRelationships(req.query);
    const service = GetRelationshipService(req);
    const relationshipsData = await service.getByEntity(sharedId);
    res.json(relationshipsData);
  });

  app.post('/api/v2/relationships', featureRequired, async (req, res) => {
    const relationships = validateCreateRelationship(req.body);
    const service = await CreateRelationshipService(req);
    const created = await service.create(relationships);
    res.json(created);
  });

  app.delete('/api/v2/relationships', featureRequired, parseQuery, async (req, res) => {
    const relationshipsIds = validateDeleteRelationships(req.query);
    const service = await DeleteRelationshipService(req);
    await service.delete(relationshipsIds.ids);
    res.status(200).send();
  });

  app.post(
    '/api/v2/relationships/migrate',
    needsAuthorization(),
    featureRequired,
    async (req, res) => {
      const timeStart = performance.now();
      const { dryRun } = validateMigration(req.body);
      const service = MigrationService();
      const {
        total,
        used,
        totalTextReferences,
        usedTextReferences,
        errors,
        hubsWithUnusedConnections,
      } = await service.migrate(dryRun);
      const timeEnd = performance.now();
      const time = timeEnd - timeStart;
      res.json({
        total,
        used,
        totalTextReferences,
        usedTextReferences,
        errors,
        time,
        dryRun,
        hubsWithUnusedConnections,
      });
    }
  );

  app.post(
    '/api/v2/relationships/test_one_hub',
    needsAuthorization(),
    featureRequired,
    async (req, res) => {
      const { hubId } = req.body;
      const {
        total,
        used,
        totalTextReferences,
        usedTextReferences,
        transformed,
        original,
        errors,
      } = await MigrationService().testOneHub(hubId);
      res.json({
        total,
        used,
        totalTextReferences,
        usedTextReferences,
        transformed,
        original,
        errors,
      });
    }
  );

  app.get(
    '/api/v2/relationshipMigrationFields',
    needsAuthorization(),
    featureRequired,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (req, res) => {
      const service = GetRelationshipMigrationFieldsService();
      const fields = await service.getAll();
      res.json(fields);
    }
  );

  app.post(
    '/api/v2/relationshipMigrationFields',
    needsAuthorization(),
    featureRequired,
    async (req, res) => {
      const field = validateUpsertRelationshipMigrationField(req.body);
      const service = UpsertRelationshipMigrationFieldService();
      const upsertedField = await service.upsert(
        field.id,
        field.sourceTemplate,
        field.relationType,
        field.targetTemplate,
        field.ignored
      );
      res.json(upsertedField);
    }
  );

  app.delete(
    '/api/v2/relationshipMigrationFields',
    needsAuthorization(),
    featureRequired,
    async (req, res) => {
      const { id } = validateDeleteRelationshipMigrationField(req.body);
      const service = DeleteRelationshipMigrationFieldService();
      await service.delete(id);
      res.status(200).send();
    }
  );
};
