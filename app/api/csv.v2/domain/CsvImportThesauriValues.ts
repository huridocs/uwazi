import { CsvThesauriPendingEntry } from '#api/csv.v2/domain/CsvThesauriPendingValues.js';

type CsvImportThesauriAppliedValue = {
  label: string;
  parentLabel?: string;
  valueId: string;
};

type CsvImportThesauriStats = {
  valuesObserved: number;
  valuesCreated: number;
};

type CsvImportThesauriValuesProps = {
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

class CsvImportThesauriValues {
  readonly importId: string;

  readonly thesaurusId: string;

  readonly entries: CsvThesauriPendingEntry[];

  readonly createdAt: number;

  readonly appliedAt?: number;

  readonly appliedValues?: CsvImportThesauriAppliedValue[];

  readonly stats?: CsvImportThesauriStats;

  private constructor(props: CsvImportThesauriValuesProps) {
    this.importId = props.importId;
    this.thesaurusId = props.thesaurusId;
    this.entries = props.entries;
    this.createdAt = props.createdAt;
    this.appliedAt = props.appliedAt;
    this.appliedValues = props.appliedValues;
    this.stats = props.stats;
  }

  static create(props: CsvImportThesauriValuesProps) {
    return new CsvImportThesauriValues(props);
  }

  withAppliedValues(
    summary: Pick<PendingValuesDiffSummary, 'observedValues' | 'createdCount'>,
    incoming: CsvImportThesauriAppliedValue[]
  ) {
    const appliedValues = this.mergeAppliedValues(incoming);
    const stats = this.combineStats(summary);
    return new CsvImportThesauriValues({
      importId: this.importId,
      thesaurusId: this.thesaurusId,
      entries: this.entries,
      createdAt: this.createdAt,
      appliedAt: Date.now(),
      appliedValues,
      stats,
    });
  }

  shouldPersist(summary: Pick<PendingValuesDiffSummary, 'hasPendingAppends' | 'observedValues'>) {
    if (summary.hasPendingAppends) {
      return true;
    }
    if (!this.appliedAt || !this.stats) {
      return true;
    }
    return this.stats.valuesObserved !== summary.observedValues;
  }

  toObject() {
    return {
      importId: this.importId,
      thesaurusId: this.thesaurusId,
      entries: this.entries,
      createdAt: this.createdAt,
      appliedAt: this.appliedAt,
      appliedValues: this.appliedValues,
      stats: this.stats,
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

  private mergeAppliedValues(incoming: CsvImportThesauriAppliedValue[]) {
    if (!incoming.length) {
      return this.appliedValues || [];
    }

    const serialize = (value: CsvImportThesauriAppliedValue) =>
      `${value.parentLabel || ''}::${value.label}::${value.valueId}`;

    const baseList = this.appliedValues || [];
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

  private combineStats(summary: Pick<PendingValuesDiffSummary, 'observedValues' | 'createdCount'>) {
    const previousStats: CsvImportThesauriStats =
      this.stats ??
      ({
        valuesObserved: summary.observedValues,
        valuesCreated: this.appliedValues?.length ?? 0,
      } satisfies CsvImportThesauriStats);

    return {
      valuesObserved: summary.observedValues,
      valuesCreated: previousStats.valuesCreated + summary.createdCount,
    };
  }
}

export type { CsvImportThesauriAppliedValue, CsvImportThesauriStats, PendingValuesDiffSummary };
export { CsvImportThesauriValues };
