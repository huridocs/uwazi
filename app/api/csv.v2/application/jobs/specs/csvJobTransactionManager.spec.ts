/* eslint-disable max-statements */
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import {
  applyCsvJobBackendFlags,
  csvJobBackendConfigs,
  itWithContext,
} from '../../../specs/csvBackendTest.js';
import { CsvCleanupImportFilesJobFactory } from '../../../infrastructure/factories/CsvCleanupImportFilesJobFactory.js';
import { CsvCreateRelationshipEntitiesJobFactory } from '../../../infrastructure/factories/CsvCreateRelationshipEntitiesJobFactory.js';
import { CsvCreateThesauriValuesJobFactory } from '../../../infrastructure/factories/CsvCreateThesauriValuesJobFactory.js';
import { CsvExtractUploadedZipJobFactory } from '../../../infrastructure/factories/CsvExtractUploadedZipJobFactory.js';
import { CsvImportEntitiesJobFactory } from '../../../infrastructure/factories/CsvImportEntitiesJobFactory.js';
import { CsvPreflightJobFactory } from '../../../infrastructure/factories/CsvPreflightJobFactory.js';

const jobFactories = [
  CsvCleanupImportFilesJobFactory,
  CsvCreateRelationshipEntitiesJobFactory,
  CsvCreateThesauriValuesJobFactory,
  CsvExtractUploadedZipJobFactory,
  CsvImportEntitiesJobFactory,
  CsvPreflightJobFactory,
];

describe('CSV job transaction manager', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(csvJobBackendConfigs)('$name', ({ postgresCsv, postgresCore }) => {
    beforeEach(() => {
      applyCsvJobBackendFlags(postgresCsv, postgresCore);
    });

    itWithContext('uses ExecutionContext.transactionManager for the job run', async () => {
      const fromContext = ExecutionContext.transactionManager;
      jobFactories.forEach(factory => {
        expect(factory.build().transactionManager === fromContext).toBe(true);
      });
    });
  });
});
