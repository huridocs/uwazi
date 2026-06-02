import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { MultiLanguageEntityDataSource } from '#api/entities.v2/contracts/MultiLanguageEntitiesDataSource.js';
import { CsvImportEntitiesJobHandler } from '../../infrastructure/jobHandlers/CsvImportEntitiesJobHandler.js';
import {
  CsvImport,
  CsvImportDomain,
  CsvImportStatus,
  CsvImportStats,
} from '../../domain/CsvImport.js';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource.js';
import { CsvImportRelationshipValuesDataSource } from '../contracts/CsvImportRelationshipValuesDataSource.js';
import { CsvImportRelationshipPendingValuesDataSource } from '../contracts/CsvImportRelationshipPendingValuesDataSource.js';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks.js';
import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues.js';
import {
  buildRelationshipAppliedValues,
  createMissingEntitiesForTitles,
} from '../services/CsvPreflightRelationshipsService.js';
import {
  createRelationshipEntitiesBatch,
  loadRelationshipCreationContext,
} from '../services/CsvRelationshipEntitiesCreator.js';
import { CsvCleanupAwareJob } from './CsvCleanupAwareJob.js';

type RelationshipsProgress = {
  importId: string;
  processedTemplates: number;
  totalTemplates: number;
  createdEntities: number;
};

type Callbacks = BaseCallbacks & {
  onProgress: (info: RelationshipsProgress) => void;
};

type Input = {
  importId: string;
  tenantName: string;
  userId: string;
  callbacks: Callbacks;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  relationshipValuesDS: CsvImportRelationshipValuesDataSource;
  relationshipPendingValuesDS: CsvImportRelationshipPendingValuesDataSource;
  entitiesService: EntitiesService;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
};

const RELATIONSHIP_TITLES_CHUNK_SIZE = 250;

class CsvCreateRelationshipEntitiesJob extends CsvCleanupAwareJob<Input, void, Deps> {
  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(csvImport, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  private async persistFailure(importId: string, error: Error) {
    const csvImportRes = await this.deps.csvImportsDS.getById(importId);
    if (csvImportRes.isError()) {
      return;
    }

    const csvImport = csvImportRes.getData();
    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(csvImport, {
        message: error.message,
        retryable: !(error instanceof NonRetryableJobError),
        at: Date.now(),
        stage: 'preflight:relationships:create',
      });
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      const withCleanup = this.withCleanupPendingIfFailed(withStatus, withStatus.status);
      await this.deps.csvImportsDS.update(withCleanup);
    });
  }

  private async finalizeSuccess(params: {
    csvImport: CsvImport;
    relationshipDocs: CsvImportRelationshipValues[];
    observedTitles: number;
    createdEntities: number;
    importId: string;
    tenantName: string;
    userId: string;
  }) {
    const {
      csvImport,
      relationshipDocs,
      observedTitles,
      createdEntities,
      importId,
      tenantName,
      userId,
    } = params;
    await this.transactionManager.run(async () => {
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withStatus = CsvImportDomain.withStatus(
        cleared,
        CsvImportStatus.PreflightRelationshipsCreateDone
      );
      const updatedStats: CsvImportStats = {
        ...(withStatus.stats || {}),
        relationshipValuesObserved: observedTitles,
        relationshipValuesCreated: createdEntities,
      };
      await this.deps.csvImportsDS.update(withStatus.withStats(updatedStats));
      await this.deps.relationshipValuesDS.replaceValues(importId, relationshipDocs);
      if (await this.deps.csvImportsDS.isCancelled(importId)) {
        return;
      }
      await this.deps.jobsDispatcher.dispatch(CsvImportEntitiesJobHandler, {
        tenantName,
        userId,
        importId,
      });
    });
  }

  private async runCreation(params: {
    importId: string;
    titlesByTemplate: Map<string, Set<string>>;
    tenantName: string;
    userId: string;
    totalTemplates: number;
    callbacks: Callbacks;
  }) {
    const { titlesByTemplate, totalTemplates, callbacks, importId, tenantName, userId } = params;
    const observedTitles = CsvCreateRelationshipEntitiesJob.countObservedTitles(titlesByTemplate);
    const shouldContinue = async () => !(await this.deps.csvImportsDS.isCancelled(importId));
    if (!titlesByTemplate.size) {
      return {
        createdEntities: 0,
        relationshipDocs: [] as CsvImportRelationshipValues[],
        observedTitles,
      };
    }

    const createdEntities = await createMissingEntitiesForTitles({
      entitiesDS: this.deps.entitiesDS,
      titlesByTemplate,
      chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
      totalTemplates,
      onBatch: info => {
        callbacks.onProgress({
          importId,
          processedTemplates: info.processedTemplates,
          totalTemplates: info.totalTemplates,
          createdEntities: info.createdEntities,
        });
      },
      createEntities: async ({ templateId, titles }) =>
        createRelationshipEntitiesBatch({
          entitiesService: this.deps.entitiesService,
          transactionManager: this.transactionManager,
          templateId,
          titles,
          tenantName,
          userId,
        }),
      shouldContinue,
    });
    if (!(await shouldContinue())) {
      return {
        createdEntities,
        relationshipDocs: [] as CsvImportRelationshipValues[],
        observedTitles,
      };
    }
    const relationshipDocs = await buildRelationshipAppliedValues({
      entitiesDS: this.deps.entitiesDS,
      importId,
      titlesByTemplate,
      chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
      shouldContinue,
    });

    return { createdEntities, relationshipDocs, observedTitles };
  }

  async execute(input: Input): Promise<void> {
    const { importId, callbacks } = input;
    if (await this.deps.csvImportsDS.isCancelled(importId)) {
      return;
    }

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightRelationshipsCreate);

    try {
      await this.runApplyFlow(input);
      if (await this.deps.csvImportsDS.isCancelled(importId)) {
        return;
      }
      callbacks.onSuccess({ importId });
    } catch (error) {
      await this.persistFailure(importId, error as Error);
      callbacks.onError({ importId, error: error as Error });
      throw error;
    }
  }

  private async runApplyFlow(input: Input) {
    const { importId, tenantName, userId, callbacks } = input;
    const { csvImport, titlesByTemplate, totalTemplates } = await loadRelationshipCreationContext({
      csvImportsDS: this.deps.csvImportsDS,
      relationshipPendingValuesDS: this.deps.relationshipPendingValuesDS,
      importId,
    });
    if (await this.deps.csvImportsDS.isCancelled(importId)) {
      return;
    }
    const creation = await this.runCreation({
      importId,
      titlesByTemplate,
      tenantName,
      userId,
      totalTemplates,
      callbacks,
    });
    await this.finalizeSuccess({
      csvImport,
      relationshipDocs: creation.relationshipDocs,
      observedTitles: creation.observedTitles,
      createdEntities: creation.createdEntities,
      importId,
      tenantName,
      userId,
    });
  }

  private static countObservedTitles(titlesByTemplate: Map<string, Set<string>>) {
    let observed = 0;
    titlesByTemplate.forEach(titles => {
      observed += titles.size;
    });
    return observed;
  }
}

export { CsvCreateRelationshipEntitiesJob };
export type { RelationshipsProgress };
