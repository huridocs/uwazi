import { computeQueryHash } from '#shared/dataviz/computeQueryHash.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';

const stableJson = (value: unknown): string => JSON.stringify(value ?? null);

const shouldPersistSnapshotOnSave = (existing: Dataviz, updated: Dataviz): boolean => {
  if (existing.dataSource !== updated.dataSource) {
    return true;
  }

  if (computeQueryHash(existing.query) !== computeQueryHash(updated.query)) {
    return true;
  }

  if (stableJson(existing.chart) !== stableJson(updated.chart)) {
    return true;
  }

  if (stableJson(existing.appearance) !== stableJson(updated.appearance)) {
    return true;
  }

  if (stableJson(existing.manualData) !== stableJson(updated.manualData)) {
    return true;
  }

  return false;
};

export { shouldPersistSnapshotOnSave };
