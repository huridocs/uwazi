/* eslint-disable max-lines, max-statements */
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
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
} from '../../domain/CsvImportThesauriValues';
import { CsvThesauriValuesDiff, ThesauriDiffResult } from '../services/CsvThesauriValuesDiff';
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
};

type PendingValuesProcessingResult = {
  created: number;
  observed: number;
};

class CsvCreateThesauriValuesJob extends AbstractUseCase<Input, void, Deps> {
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

  private static extractAppliedValues(
    thesaurus: ThesaurusSchema,
    descriptors: ThesauriDiffResult['createdDescriptors']
  ): CsvImportThesauriAppliedValue[] {
    const roots = new Map<string, any>();
    (thesaurus.values || []).forEach(root => {
      roots.set(root.label, root);
    });

    return descriptors
      .map((descriptor: ThesauriDiffResult['createdDescriptors'][number]) => {
        if (!descriptor.parentLabel) {
          const root = roots.get(descriptor.label);
          if (root?.id) {
            return {
              label: descriptor.label,
              valueId: root.id,
            };
          }
          return undefined;
        }
        const parent = roots.get(descriptor.parentLabel);
        const child = parent?.values?.find((value: any) => value.label === descriptor.label);
        if (child?.id) {
          return {
            label: descriptor.label,
            parentLabel: descriptor.parentLabel,
            valueId: child.id,
          };
        }
        return undefined;
      })
      .filter(Boolean) as CsvImportThesauriAppliedValue[];
  }

  private async persistPendingValuesApplication(params: {
    pendingDoc: CsvImportThesauriValues;
    diff: ThesauriDiffResult;
    appliedValues: CsvImportThesauriAppliedValue[];
  }) {
    const { pendingDoc, diff, appliedValues } = params;
    const previousStats = pendingDoc.stats ?? {
      valuesObserved: diff.observedValues,
      valuesCreated: pendingDoc.appliedValues?.length ?? 0,
    };
    const updatedStats = {
      valuesObserved: diff.observedValues,
      valuesCreated: previousStats.valuesCreated + diff.createdDescriptors.length,
    };
    const combinedAppliedValues = [
      ...(pendingDoc.appliedValues || []),
      ...appliedValues.filter(
        newValue =>
          !(pendingDoc.appliedValues || []).some(
            existing =>
              existing.valueId === newValue.valueId &&
              existing.label === newValue.label &&
              existing.parentLabel === newValue.parentLabel
          )
      ),
    ];

    const appliedAt = Date.now();
    await this.deps.thesauriValuesDS.markAsApplied({
      importId: pendingDoc.importId,
      thesaurusId: pendingDoc.thesaurusId,
      appliedAt,
      appliedValues: combinedAppliedValues,
      stats: updatedStats,
    });

    pendingDoc.appliedAt = appliedAt;
    pendingDoc.appliedValues = combinedAppliedValues;
    pendingDoc.stats = updatedStats;
  }

  private async applyPendingThesaurusValues(params: {
    pendingDoc: CsvImportThesauriValues;
    index: number;
    total: number;
    callbacks: Callbacks;
  }): Promise<PendingValuesProcessingResult> {
    const { pendingDoc, index, total, callbacks } = params;
    const existingThesaurus = await this.deps.thesauriRepo.getById(pendingDoc.thesaurusId);
    const diff = CsvThesauriValuesDiff.diff(pendingDoc, existingThesaurus);

    let appliedValues: CsvImportThesauriAppliedValue[] = [];

    let updatedThesaurus = existingThesaurus;

    if (diff.valuesToAppend.length) {
      updatedThesaurus = await this.deps.thesauriRepo.appendValues(
        pendingDoc.thesaurusId,
        diff.valuesToAppend
      );
      if (Object.keys(diff.translations).length) {
        await this.deps.translationsRepo.updateEntries(pendingDoc.thesaurusId, diff.translations);
      }
      appliedValues = CsvCreateThesauriValuesJob.extractAppliedValues(
        updatedThesaurus,
        diff.createdDescriptors
      );
    }

    const shouldPersist =
      diff.valuesToAppend.length > 0 ||
      !pendingDoc.appliedAt ||
      !pendingDoc.stats ||
      pendingDoc.stats.valuesObserved !== diff.observedValues;

    if (shouldPersist) {
      await this.persistPendingValuesApplication({ pendingDoc, diff, appliedValues });
    }

    callbacks.onProgress({
      importId: pendingDoc.importId,
      thesaurusId: pendingDoc.thesaurusId,
      processedThesauri: index,
      totalThesauri: total,
      createdValues: diff.createdDescriptors.length,
    });

    return {
      created: diff.createdDescriptors.length,
      observed: diff.observedValues,
    };
  }

  private static aggregateStats(pendingDocs: CsvImportThesauriValues[]): {
    observed: number;
    created: number;
    touched: number;
  } {
    return pendingDocs.reduce(
      (acc, pendingDoc) => {
        const { stats } = pendingDoc;
        if (stats) {
          acc.observed += stats.valuesObserved;
          acc.created += stats.valuesCreated;
        }
        if (pendingDoc.entries.length) {
          acc.touched += 1;
        }
        return acc;
      },
      { observed: 0, created: 0, touched: 0 }
    );
  }

  private async finalizeSuccess(csvImport: CsvImport, pendingDocs: CsvImportThesauriValues[]) {
    const totals = CsvCreateThesauriValuesJob.aggregateStats(pendingDocs);
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
