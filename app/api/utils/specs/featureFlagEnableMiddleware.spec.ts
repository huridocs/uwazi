import express, { Application } from 'express';
import request from 'supertest';

import { tenants } from '#api/tenants/index.js';

import { TenantFeatureFlags } from '#api/tenants/tenantContext.js';
import { appContextMiddleware } from '#api/utils/appContextMiddleware.js';
import { multitenantMiddleware } from '#api/utils/multitenantMiddleware.js';

import { featureFlagEnabled } from '#api/utils/featureFlagEnabledMiddleware.js';

const testingRoutes = (app: Application) => {
  app.get(
    '/api/paragraphExtractionTest',
    featureFlagEnabled('paragraphExtraction'),
    (_req, res, next) => {
      res.json({ success: true });
      next();
    }
  );
};

const prepareScenarioForFlag = async (flagKey: TenantFeatureFlags, flagValue: boolean) => {
  tenants.add({ name: 'test', featureFlags: { [flagKey]: flagValue } });

  const app: Application = express();
  app.use(appContextMiddleware);
  app.use(multitenantMiddleware);
  testingRoutes(app);

  return request(app).get(`/api/${flagKey}Test`).set('tenant', 'test');
};

describe('Feature Flag Enabled middleware', () => {
  it('should call on next if flag enabled', async () => {
    const response = await prepareScenarioForFlag('paragraphExtraction', true);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
