import { CsvThesauriPendingEntry } from './CsvThesauriPendingValues';

type CsvImportThesauriAppliedValue = {
  label: string;
  parentLabel?: string;
  valueId: string;
};

type CsvImportThesauriStats = {
  valuesObserved: number;
  valuesCreated: number;
};

type CsvImportThesauriValues = {
  importId: string;
  thesaurusId: string;
  entries: CsvThesauriPendingEntry[];
  createdAt: number;
  appliedAt?: number;
  appliedValues?: CsvImportThesauriAppliedValue[];
  stats?: CsvImportThesauriStats;
};

type PendingValuesDiffSummary = {
  observedValues: number;
  createdCount: number;
  hasPendingAppends: boolean;
};

class CsvImportThesauriValuesDomain {
  private static buildAppliedValuesList(
    existing: CsvImportThesauriAppliedValue[] | undefined,
    incoming: CsvImportThesauriAppliedValue[]
  ) {
    if (!incoming.length) {
      return existing || [];
    }

    const serialize = (value: CsvImportThesauriAppliedValue) =>
      `${value.parentLabel || ''}::${value.label}::${value.valueId}`;

    const baseList = existing || [];
    const seen = new Set(baseList.map(serialize));
    const additions = incoming.filter(value => {
      const key = serialize(value);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return [...baseList, ...additions];
  }

  static shouldPersist(
    pendingDoc: CsvImportThesauriValues,
    summary: Pick<PendingValuesDiffSummary, 'hasPendingAppends' | 'observedValues'>
  ) {
    if (summary.hasPendingAppends) {
      return true;
    }
    if (!pendingDoc.appliedAt || !pendingDoc.stats) {
      return true;
    }
    return pendingDoc.stats.valuesObserved !== summary.observedValues;
  }

  static buildPersistencePayload(
    pendingDoc: CsvImportThesauriValues,
    summary: Pick<PendingValuesDiffSummary, 'observedValues' | 'createdCount'>,
    appliedValues: CsvImportThesauriAppliedValue[]
  ) {
    const combinedAppliedValues = CsvImportThesauriValuesDomain.buildAppliedValuesList(
      pendingDoc.appliedValues,
      appliedValues
    );
    const previousStats =
      pendingDoc.stats ??
      ({
        valuesObserved: summary.observedValues,
        valuesCreated: pendingDoc.appliedValues?.length ?? 0,
      } satisfies CsvImportThesauriStats);

    const stats: CsvImportThesauriStats = {
      valuesObserved: summary.observedValues,
      valuesCreated: previousStats.valuesCreated + summary.createdCount,
    };

    const appliedAt = Date.now();

    return {
      appliedAt,
      appliedValues: combinedAppliedValues,
      stats,
    };
  }

  static aggregateStats(pendingDocs: CsvImportThesauriValues[]) {
    return pendingDocs.reduce(
      (acc, pendingDoc) => {
        if (pendingDoc.stats) {
          acc.observed += pendingDoc.stats.valuesObserved;
          acc.created += pendingDoc.stats.valuesCreated;
        }
        if (pendingDoc.entries.length) {
          acc.touched += 1;
        }
        return acc;
      },
      { observed: 0, created: 0, touched: 0 }
    );
  }
}

export type {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriStats,
  CsvImportThesauriValues,
  PendingValuesDiffSummary,
};
export { CsvImportThesauriValuesDomain };
