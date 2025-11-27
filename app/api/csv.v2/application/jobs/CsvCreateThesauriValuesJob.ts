import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
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
  CsvImportThesauriValuesDomain,
  PendingValuesDiffSummary,
} from '../../domain/CsvImportThesauriValues';
import { PendingThesauriValuesApplier } from '../services/PendingThesauriValuesApplier';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';

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
  callbacks: Callbacks;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  thesauriValuesDS: CsvImportThesauriValuesDataSource;
  thesauriRepo: ThesauriRepository;
  translationsRepo: TranslationsRepository;
  transactionManager: TransactionManager;
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
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (!existing) {
      throw new NonRetryableJobError(new Error(`CSV import not found: ${importId}`));
    }
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(existing, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  private async getImport(importId: string) {
    const csvImport = await this.deps.csvImportsDS.getById(importId);
    if (!csvImport) {
      throw new NonRetryableJobError(new Error(`CSV import not found: ${importId}`));
    }
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
    const payload = CsvImportThesauriValuesDomain.buildPersistencePayload(
      pendingDoc,
      summary,
      appliedValues
    );

    await this.deps.thesauriValuesDS.markAsApplied({
      importId: pendingDoc.importId,
      thesaurusId: pendingDoc.thesaurusId,
      appliedAt: payload.appliedAt,
      appliedValues: payload.appliedValues,
      stats: payload.stats,
    });

    pendingDoc.appliedAt = payload.appliedAt;
    pendingDoc.appliedValues = payload.appliedValues;
    pendingDoc.stats = payload.stats;
  }

  private async applyPendingThesaurusValues(params: {
    pendingDoc: CsvImportThesauriValues;
    index: number;
    total: number;
    callbacks: Callbacks;
  }): Promise<PendingValuesProcessingResult> {
    const { pendingDoc, index, total, callbacks } = params;
    const { diff, appliedValues } = await this.pendingValuesApplier.apply(pendingDoc);

    const summary: PendingValuesDiffSummary = {
      observedValues: diff.observedValues,
      createdCount: diff.createdDescriptors.length,
      hasPendingAppends: diff.valuesToAppend.length > 0,
    };

    if (CsvImportThesauriValuesDomain.shouldPersist(pendingDoc, summary)) {
      await this.persistPendingValuesApplication({ pendingDoc, summary, appliedValues });
    }

    callbacks.onProgress({
      importId: pendingDoc.importId,
      thesaurusId: pendingDoc.thesaurusId,
      processedThesauri: index,
      totalThesauri: total,
      createdValues: summary.createdCount,
    });

    return {
      created: summary.createdCount,
      observed: summary.observedValues,
    };
  }

  private async finalizeSuccess(csvImport: CsvImport, pendingDocs: CsvImportThesauriValues[]) {
    const totals = CsvImportThesauriValuesDomain.aggregateStats(pendingDocs);
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
      await this.deps.csvImportsDS.update({
        ...withStatus,
        stats: updatedStats,
      });
    });
  }

  private async persistFailure(importId: string, error: Error) {
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (!existing) {
      return;
    }
    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(existing, {
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
  protected async executeAsync(input: Input): Promise<void> {
    const { importId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightThesauriCreate);

    let csvImport: CsvImport | undefined;

    try {
      csvImport = await this.getImport(importId);
      const pendingDocs = await this.getPendingThesauriValues(importId);

      if (!pendingDocs.length) {
        await this.finalizeSuccess(csvImport, pendingDocs);
        callbacks.onSuccess({ importId });
        return;
      }

      let index = 0;
      for (const pendingDoc of pendingDocs) {
        index += 1;
        // eslint-disable-next-line no-await-in-loop
        await this.applyPendingThesaurusValues({
          pendingDoc,
          index,
          total: pendingDocs.length,
          callbacks,
        });
      }

      await this.finalizeSuccess(csvImport, pendingDocs);
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
