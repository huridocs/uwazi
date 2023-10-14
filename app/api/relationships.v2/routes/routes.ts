import { performance } from 'perf_hooks';

import { Application, NextFunction, Request, Response } from 'express';

import { needsAuthorization } from 'api/auth';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { parseQuery } from 'api/utils';
import { GetMigrationHubRecordsResponse } from 'shared/types/api.v2/migrationHubRecords.get';
import { MigrationResponse } from 'shared/types/api.v2/relationships.migrate';
import { TestOneHubResponse } from 'shared/types/api.v2/relationships.testOneHub';
import { CreateRelationshipMigRationFieldResponse } from 'shared/types/api.v2/relationshipMigrationField.create';
import { GetRelationshipMigrationFieldsResponse } from 'shared/types/api.v2/relationshipMigrationField.get';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import {
  CreateRelationshipMigrationFieldService,
  CreateRelationshipService,
  DeleteRelationshipMigrationFieldService,
  DeleteRelationshipService,
  GetMigrationHubRecordsService,
  GetRelationshipMigrationFieldsService,
  GetRelationshipService,
  MigrationService,
  UpsertRelationshipMigrationFieldService,
} from '../services/service_factories';
import { validateCreateRelationship } from './validators/createRelationship';
import { validateDeleteRelationships } from './validators/deleteRelationships';
import { validateGetRelationships } from './validators/getRelationship';
import { validateMigration, validateTestOneHub } from './validators/migration';
import { validateDeleteRelationshipMigrationField } from './validators/deleteRelationshipMigrationFields';
import { validateUpsertRelationshipMigrationField } from './validators/upsertRelationshipMigrationFields';

import { validateGetMigrationHubRecordsRequest } from './validators/getMigrationHubRecords';

const featureRequired = async (_req: Request, res: Response, next: NextFunction) => {
  if (
    !(await DefaultSettingsDataSource(DefaultTransactionManager()).readNewRelationshipsAllowed())
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
    async (req: Request, res: Response<MigrationResponse>) => {
      const timeStart = performance.now();
      const { dryRun, migrationPlan } = validateMigration(req.body);
      const service = MigrationService();
      const { total, used, totalTextReferences, usedTextReferences, errors } =
        await service.migrate(dryRun, migrationPlan);
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
      });
    }
  );

  app.post(
    '/api/v2/relationships/test_one_hub',
    needsAuthorization(),
    featureRequired,
    async (req: Request, res: Response<TestOneHubResponse>) => {
      const { hubId, migrationPlan } = validateTestOneHub(req.body);
      const {
        total,
        used,
        totalTextReferences,
        usedTextReferences,
        transformed,
        original,
        errors,
      } = await MigrationService().testOneHub(hubId, migrationPlan);
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
    async (req: Request, res: Response<GetRelationshipMigrationFieldsResponse>) => {
      const service = GetRelationshipMigrationFieldsService();
      const fields = await service.getAllCombinedWithInferred();
      res.json(fields);
    }
  );

  app.put(
    '/api/v2/relationshipMigrationFields',
    needsAuthorization(),
    featureRequired,
    async (req: Request, res: Response<CreateRelationshipMigRationFieldResponse>) => {
      const field = validateUpsertRelationshipMigrationField(req.body);
      const service = CreateRelationshipMigrationFieldService();
      const created = await service.create(
        field.sourceTemplate,
        field.relationType,
        field.targetTemplate,
        field.ignored
      );
      res.json(created);
    }
  );

  app.post(
    '/api/v2/relationshipMigrationFields',
    needsAuthorization(),
    featureRequired,
    async (req: Request, res: Response<CreateRelationshipMigRationFieldResponse>) => {
      const field = validateUpsertRelationshipMigrationField(req.body);
      const service = UpsertRelationshipMigrationFieldService();
      const updated = await service.upsert(
        field.sourceTemplate,
        field.relationType,
        field.targetTemplate,
        field.ignored
      );
      res.json(updated);
    }
  );

  app.delete(
    '/api/v2/relationshipMigrationFields',
    needsAuthorization(),
    featureRequired,
    async (req: Request, res: Response<void>) => {
      const { sourceTemplate, relationType, targetTemplate } =
        validateDeleteRelationshipMigrationField(req.query);
      const service = DeleteRelationshipMigrationFieldService();
      await service.delete(sourceTemplate, relationType, targetTemplate);
      res.status(200).send();
    }
  );

  app.get(
    '/api/v2/migrationHubRecords',
    needsAuthorization(),
    featureRequired,
    async (req: Request, res: Response<GetMigrationHubRecordsResponse>) => {
      const { page: _page, pageSize: _pageSize } = validateGetMigrationHubRecordsRequest(req.query);
      const page = parseInt(_page, 10);
      const pageSize = parseInt(_pageSize, 10);
      const service = GetMigrationHubRecordsService();
      const records = await service.getPage(page, pageSize);
      res.json(records);
    }
  );
};
