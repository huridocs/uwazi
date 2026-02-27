import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { CsvImportsDataSource } from '../../application/contracts/CsvImportsDataSource';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource';
import { ThesauriRepository } from '../../application/contracts/ThesauriRepository';
import { TranslationsRepository } from '../../application/contracts/TranslationsRepository';
import {
  CsvImport,
  CsvImportDomain,
  CsvImportStatus,
  CsvImportStats,
} from '../../domain/CsvImport';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
  PendingValuesDiffSummary,
} from '../../domain/CsvImportThesauriValues';
import { PendingThesauriValuesApplier } from '../services/PendingThesauriValuesApplier';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';
import { CsvCreateRelationshipEntitiesJobHandler } from '../../infrastructure/jobHandlers/CsvCreateRelationshipEntitiesJobHandler';

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
  thesauriRepo: ThesauriRepository;
  translationsRepo: TranslationsRepository;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
};

type PendingValuesProcessingResult = {
  created: number;
  observed: number;
};

class CsvCreateThesauriValuesJob extends AbstractUseCase<Input, void, Deps> {
  private pendingValuesApplier: PendingThesauriValuesApplier;

  constructor(deps: Deps) {
    super(deps);
    this.pendingValuesApplier = new PendingThesauriValuesApplier({
      thesauriRepo: deps.thesauriRepo,
      translationsRepo: deps.translationsRepo,
    });
  }

  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(csvImport, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
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
  }): Promise<{
    result: PendingValuesProcessingResult;
    updatedDoc: CsvImportThesauriValues;
  }> {
    const { pendingDoc, index, total, callbacks } = params;
    const { diff, appliedValues } = await this.pendingValuesApplier.apply(pendingDoc);

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
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  // eslint-disable-next-line max-statements
  async execute(input: Input): Promise<void> {
    const { importId, callbacks, tenantName, userId } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightThesauriCreate);

    let csvImport: CsvImport | undefined;

    try {
      csvImport = await this.getImport(importId);
      const pendingDocs = await this.getPendingThesauriValues(importId);

      let index = 0;
      for (const pendingDoc of pendingDocs) {
        index += 1;
        // eslint-disable-next-line no-await-in-loop
        const { updatedDoc } = await this.applyPendingThesaurusValues({
          pendingDoc,
          index,
          total: pendingDocs.length,
          callbacks,
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
