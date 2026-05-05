/* eslint-disable max-lines */
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import {
  CsvImport,
  CsvImportDomain,
  CsvImportStatus,
  CsvImportStats,
} from '../../domain/CsvImport.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
  PendingValuesDiffSummary,
} from '../../domain/CsvImportThesauriValues.js';
import { CsvCreateRelationshipEntitiesJobHandler } from '../../infrastructure/jobHandlers/CsvCreateRelationshipEntitiesJobHandler.js';
import { PendingThesauriValuesApplier } from '../services/PendingThesauriValuesApplier.js';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks.js';
import { CsvCleanupAwareJob } from './CsvCleanupAwareJob.js';

type ThesauriCreationProgress = {
  importId: string;
  thesaurusId: string;
  processedThesauri: number;
  totalThesauri: number;
  createdValues: number;
};

type Callbacks = BaseCallbacks & {
  onProgress: (info: ThesauriCreationProgress) => void;
};

type Input = {
  importId: string;
  tenantName: string;
  userId: string;
  callbacks: Callbacks;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  thesauriValuesDS: CsvImportThesauriValuesDataSource;
  thesauriDS: ThesauriDataSource;
  thesauriService: ThesauriService;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
};

type PendingValuesProcessingResult = {
  created: number;
  observed: number;
};

class CsvCreateThesauriValuesJob extends CsvCleanupAwareJob<Input, void, Deps> {
  private pendingValuesApplier: PendingThesauriValuesApplier;

  constructor(deps: Deps) {
    super(deps);
    this.pendingValuesApplier = new PendingThesauriValuesApplier({
      thesauriDS: deps.thesauriDS,
      thesauriService: deps.thesauriService,
    });
  }

  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(csvImport, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  private async getImport(importId: string) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    return csvImport;
  }

  private async getPendingThesauriValues(importId: string) {
    const pendingDocs = await this.deps.thesauriValuesDS.getByImport(importId);
    return pendingDocs;
  }

  private async persistPendingValuesApplication(params: {
    pendingDoc: CsvImportThesauriValues;
    summary: Pick<PendingValuesDiffSummary, 'observedValues' | 'createdCount'>;
    appliedValues: CsvImportThesauriAppliedValue[];
  }) {
    const { pendingDoc, summary, appliedValues } = params;
    const updatedDoc = pendingDoc.withAppliedValues(summary, appliedValues);

    await this.deps.thesauriValuesDS.markAsApplied({
      importId: updatedDoc.importId,
      thesaurusId: updatedDoc.thesaurusId,
      appliedAt: updatedDoc.appliedAt!,
      appliedValues: updatedDoc.appliedValues!,
      stats: updatedDoc.stats!,
    });

    return updatedDoc;
  }

  private async applyPendingThesaurusValues(params: {
    pendingDoc: CsvImportThesauriValues;
    index: number;
    total: number;
    callbacks: Callbacks;
    tenantName: string;
    userId: string;
  }): Promise<{
    result: PendingValuesProcessingResult;
    updatedDoc: CsvImportThesauriValues;
  }> {
    const { pendingDoc, index, total, callbacks, tenantName, userId } = params;
    const { diff, appliedValues } = await this.pendingValuesApplier.apply(pendingDoc, {
      tenantName,
      userId,
    });

    const summary: PendingValuesDiffSummary = {
      observedValues: diff.observedValues,
      createdCount: diff.createdDescriptors.length,
      hasPendingAppends: diff.valuesToAppend.length > 0,
    };

    let updatedDoc = pendingDoc;
    if (updatedDoc.shouldPersist(summary, appliedValues)) {
      updatedDoc = await this.persistPendingValuesApplication({
        pendingDoc: updatedDoc,
        summary,
        appliedValues,
      });
    }

    callbacks.onProgress({
      importId: updatedDoc.importId,
      thesaurusId: updatedDoc.thesaurusId,
      processedThesauri: index,
      totalThesauri: total,
      createdValues: summary.createdCount,
    });

    return {
      result: {
        created: summary.createdCount,
        observed: summary.observedValues,
      },
      updatedDoc,
    };
  }

  private async finalizeSuccess(params: {
    csvImport: CsvImport;
    pendingDocs: CsvImportThesauriValues[];
    importId: string;
    tenantName: string;
    userId: string;
  }) {
    const { csvImport, pendingDocs, importId, tenantName, userId } = params;
    const totals = CsvImportThesauriValues.aggregateStats(pendingDocs);
    await this.transactionManager.run(async () => {
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withStatus = CsvImportDomain.withStatus(
        cleared,
        CsvImportStatus.PreflightThesauriCreateDone
      );
      const updatedStats: CsvImportStats = {
        ...(withStatus.stats || {}),
        thesaurusValuesObserved: totals.observed,
        thesaurusValuesCreated: totals.created,
        thesauriTouched: totals.touched,
      };
      await this.deps.csvImportsDS.update(withStatus.withStats(updatedStats));
      if (await this.deps.csvImportsDS.isCancelled(importId)) {
        return;
      }
      await this.deps.jobsDispatcher.dispatch(CsvCreateRelationshipEntitiesJobHandler, {
        tenantName,
        userId,
        importId,
      });
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
        stage: 'preflight:thesauri:create',
      });
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      const withCleanup = this.withCleanupPendingIfFailed(withStatus, withStatus.status);
      await this.deps.csvImportsDS.update(withCleanup);
    });
  }

  // eslint-disable-next-line max-statements
  async execute(input: Input): Promise<void> {
    const { importId, callbacks, tenantName, userId } = input;
    if (await this.deps.csvImportsDS.isCancelled(importId)) {
      return;
    }

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightThesauriCreate);

    let csvImport: CsvImport | undefined;

    try {
      csvImport = await this.getImport(importId);
      const pendingDocs = await this.getPendingThesauriValues(importId);

      let index = 0;
      for (const pendingDoc of pendingDocs) {
        // eslint-disable-next-line no-await-in-loop
        if (await this.deps.csvImportsDS.isCancelled(importId)) {
          return;
        }
        index += 1;
        // eslint-disable-next-line no-await-in-loop
        const { updatedDoc } = await this.applyPendingThesaurusValues({
          pendingDoc,
          index,
          total: pendingDocs.length,
          callbacks,
          tenantName,
          userId,
        });
        pendingDocs[index - 1] = updatedDoc;
      }

      await this.finalizeSuccess({
        csvImport,
        pendingDocs,
        importId,
        tenantName,
        userId,
      });
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
}

export { CsvCreateThesauriValuesJob };
export type { ThesauriCreationProgress };
