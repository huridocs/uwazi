/* eslint-disable max-classes-per-file */
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

const IMPORT_ID = 'import-id';
const USER_ID = 'user-id';
const TENANT_NAME = 'tenant';
const REL_TEMPLATE_ID = 'rel-template';

const createTransactionManager = () =>
  ({
    run: jest.fn(async (fn: any) => fn()),
  }) as any;

const createCsvImport = () =>
  CsvImportDomain.create({
    id: IMPORT_ID,
    templateId: 'template-id',
    file: { originalName: 'file.csv', mimeType: 'text/csv', size: 10 },
    createdBy: USER_ID,
  });

const createCallbacks = () => ({
  onStart: jest.fn(),
  onProgress: jest.fn(),
  onSuccess: jest.fn(),
  onError: jest.fn(),
});

// eslint-disable-next-line max-statements
const buildUseCase = (params: {
  pendingDocs?: CsvImportRelationshipPendingValues[];
  entitiesDS?: {
    getSharedIdsByTemplateAndTitles: jest.Mock;
    bulkInsert: jest.Mock;
  };
  templatesDS?: { getById: jest.Mock };
}) => {
  const transactionManager = createTransactionManager();
  const csvImport = createCsvImport();
  const csvImportsDS = {
    getById: jest.fn().mockResolvedValue(Result.ok(csvImport)),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const relationshipPendingValuesDS = {
    getByImport: jest.fn().mockResolvedValue(params.pendingDocs ?? []),
  };
  const relationshipValuesDS = {
    replaceValues: jest.fn().mockResolvedValue(undefined),
  };
  const templatesDS = params.templatesDS ?? { getById: jest.fn() };
  const settingsDS = {
    getDefaultLanguageKey: jest.fn().mockResolvedValue('en'),
  };
  const entitiesDS =
    params.entitiesDS ??
    ({
      getSharedIdsByTemplateAndTitles: jest.fn(),
      bulkInsert: jest.fn(),
    } as any);
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

  return {
    useCase,
    deps: {
      csvImportsDS,
      relationshipValuesDS,
      relationshipPendingValuesDS,
      entitiesDS,
      templatesDS,
      jobsDispatcher,
    },
  };
};

const runJob = async (params: {
  pendingDocs?: CsvImportRelationshipPendingValues[];
  entitiesDS?: {
    getSharedIdsByTemplateAndTitles: jest.Mock;
    bulkInsert: jest.Mock;
  };
  templatesDS?: { getById: jest.Mock };
}) => {
  const { useCase, deps } = buildUseCase(params);
  const callbacks = createCallbacks();
  await useCase.execute({
    importId: IMPORT_ID,
    tenantName: TENANT_NAME,
    userId: USER_ID,
    callbacks,
  });
  return { deps, callbacks };
};

const expectFinalStats = (csvImportsDS: { update: jest.Mock }, stats: object) => {
  const finalUpdate = csvImportsDS.update.mock.calls.pop()?.[0];
  expect(finalUpdate?.status).toBe(CsvImportStatus.PreflightRelationshipsCreateDone);
  expect(finalUpdate?.stats).toEqual(expect.objectContaining(stats));
};

describe('CsvCreateRelationshipEntitiesJob', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should skip progress when there are no relationship titles', async () => {
    const { deps, callbacks } = await runJob({ pendingDocs: [] });

    expect(deps.entitiesDS.bulkInsert).not.toHaveBeenCalled();
    expect(callbacks.onProgress).not.toHaveBeenCalled();
    expect(deps.relationshipValuesDS.replaceValues).toHaveBeenCalledWith(IMPORT_ID, []);
    expect(deps.jobsDispatcher.dispatch).toHaveBeenCalledWith(
      CsvImportEntitiesJobHandler,
      expect.objectContaining({ importId: IMPORT_ID, tenantName: TENANT_NAME, userId: USER_ID })
    );
    expectFinalStats(deps.csvImportsDS, {
      relationshipValuesObserved: 0,
      relationshipValuesCreated: 0,
    });
  });

  it('should create missing entities, persist applied values, and dispatch import job', async () => {
    const pendingDocs = [
      CsvImportRelationshipPendingValues.create({
        importId: IMPORT_ID,
        templateId: REL_TEMPLATE_ID,
        titles: ['Related 1', 'Related 2'],
        createdAt: Date.now(),
      }),
    ];
    const templatesDS = {
      getById: jest
        .fn()
        .mockResolvedValue(
          Result.ok(TemplateBuilder.aTemplate({ id: REL_TEMPLATE_ID, name: 'Related' }).build())
        ),
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

    const { deps, callbacks } = await runJob({ pendingDocs, templatesDS, entitiesDS });

    expect(deps.entitiesDS.bulkInsert).toHaveBeenCalled();
    expect(deps.relationshipValuesDS.replaceValues).toHaveBeenCalledWith(
      IMPORT_ID,
      expect.arrayContaining([
        expect.objectContaining({
          importId: IMPORT_ID,
          templateId: REL_TEMPLATE_ID,
          values: [
            { label: 'Related 1', sharedId: 'shared-1' },
            { label: 'Related 2', sharedId: 'shared-2' },
          ],
        }),
      ])
    );
    expect(deps.jobsDispatcher.dispatch).toHaveBeenCalledWith(
      CsvImportEntitiesJobHandler,
      expect.objectContaining({ importId: IMPORT_ID, tenantName: TENANT_NAME, userId: USER_ID })
    );
    expect(callbacks.onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        importId: IMPORT_ID,
        processedTemplates: 1,
        totalTemplates: 1,
        createdEntities: 2,
      })
    );
    expectFinalStats(deps.csvImportsDS, {
      relationshipValuesObserved: 2,
      relationshipValuesCreated: 2,
    });
  });
});
