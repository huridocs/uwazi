import { Result } from 'api/core/libs/Result';
import { TemplateBuilder } from 'api/core/domain/template/specs/TemplateBuilder';
import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport';
import { CsvImportRelationshipPendingValues } from '../../../domain/CsvImportRelationshipPendingValues';
import { CsvCreateRelationshipEntitiesJob } from '../../jobs/CsvCreateRelationshipEntitiesJob';
import { CsvImportEntitiesJobHandler } from '../../../infrastructure/jobHandlers/CsvImportEntitiesJobHandler';

jest.mock('api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob', () => ({
  TemplatePostProcessEntitiesJob: class {},
}));
jest.mock('api/core/application/TemplatePostProcessService', () => ({
  TemplatePostProcessService: class {},
}));

const createTransactionManager = () =>
  ({
    run: jest.fn(async (fn: any) => fn()),
  }) as any;

describe('CsvCreateRelationshipEntitiesJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create missing entities, persist applied values, and dispatch import job', async () => {
    const transactionManager = createTransactionManager();
    const csvImport = CsvImportDomain.create({
      id: 'import-id',
      templateId: 'template-id',
      file: { originalName: 'file.csv', mimeType: 'text/csv', size: 10 },
      createdBy: 'user-id',
    });

    const csvImportsDS = {
      getById: jest.fn().mockResolvedValue(Result.ok(csvImport)),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const relationshipPendingValuesDS = {
      getByImport: jest.fn().mockResolvedValue([
        CsvImportRelationshipPendingValues.create({
          importId: 'import-id',
          templateId: 'rel-template',
          titles: ['Related 1', 'Related 2'],
          createdAt: Date.now(),
        }),
      ]),
    };
    const relationshipValuesDS = {
      replaceValues: jest.fn().mockResolvedValue(undefined),
    };
    const templatesDS = {
      getById: jest.fn().mockResolvedValue(
        Result.ok(TemplateBuilder.aTemplate({ id: 'rel-template', name: 'Related' }).build())
      ),
    };
    const settingsDS = {
      getDefaultLanguageKey: jest.fn().mockResolvedValue('en'),
    };
    const entitiesDS = {
      getSharedIdsByTemplateAndTitles: jest
        .fn()
        .mockImplementationOnce(async () => [])
        .mockImplementationOnce(async (_templateId: string, titles: string[]) =>
          titles.map((title, index) => ({ title, sharedId: `shared-${index + 1}` }))
        ),
      bulkInsert: jest.fn().mockResolvedValue(undefined),
    };
    const jobsDispatcher = {
      dispatch: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new CsvCreateRelationshipEntitiesJob({
      csvImportsDS: csvImportsDS as any,
      templatesDS: templatesDS as any,
      settingsDS: settingsDS as any,
      entitiesDS: entitiesDS as any,
      relationshipValuesDS: relationshipValuesDS as any,
      relationshipPendingValuesDS: relationshipPendingValuesDS as any,
      transactionManager: transactionManager as any,
      jobsDispatcher: jobsDispatcher as any,
    });

    const callbacks = {
      onStart: jest.fn(),
      onProgress: jest.fn(),
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };

    await useCase.execute({
      importId: 'import-id',
      tenantName: 'tenant',
      userId: 'user-id',
      callbacks,
    });

    expect(entitiesDS.bulkInsert).toHaveBeenCalled();
    expect(relationshipValuesDS.replaceValues).toHaveBeenCalledWith(
      'import-id',
      expect.arrayContaining([
        expect.objectContaining({
          importId: 'import-id',
          templateId: 'rel-template',
          values: [
            { label: 'Related 1', sharedId: 'shared-1' },
            { label: 'Related 2', sharedId: 'shared-2' },
          ],
        }),
      ])
    );
    expect(jobsDispatcher.dispatch).toHaveBeenCalledWith(
      CsvImportEntitiesJobHandler,
      expect.objectContaining({ importId: 'import-id', tenantName: 'tenant', userId: 'user-id' })
    );
    expect(callbacks.onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        importId: 'import-id',
        processedTemplates: 1,
        totalTemplates: 1,
        createdEntities: 2,
      })
    );
    const finalUpdate = csvImportsDS.update.mock.calls.pop()?.[0];
    expect(finalUpdate?.status).toBe(CsvImportStatus.PreflightRelationshipsCreateDone);
    expect(callbacks.onSuccess).toHaveBeenCalledWith({ importId: 'import-id' });
  });
});
