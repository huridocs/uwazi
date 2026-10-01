import type { TenantPatch, TenantRecord } from '../application/contracts/TenantsDataSource.js';

type Group = Record<string, unknown>;

const isGroup = (value: unknown): value is Group =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeGroup = (current: unknown, patch: Group): Group => {
  const merged: Group = isGroup(current) ? { ...current } : {};

  Object.entries(patch).forEach(([key, value]) => {
    if (value === null) {
      delete merged[key];
    } else if (value !== undefined) {
      merged[key] = value;
    }
  });

  return merged;
};

/** Feature flags merge flag by flag, and the flags inside a group merge one level deeper. */
const mergeFlags = (current: TenantRecord['featureFlags'], patch: Group): Group => {
  const merged: Group = { ...current };

  Object.entries(patch).forEach(([flag, value]) => {
    if (value === null) {
      delete merged[flag];
    } else if (isGroup(value)) {
      merged[flag] = mergeGroup(merged[flag], value);
    } else if (value !== undefined) {
      merged[flag] = value;
    }
  });

  return merged;
};

/**
 * The record a tenant becomes once the patch is applied: `undefined` leaves a field alone, `null`
 * removes it, anything else sets it; `featureFlags` and `metadata` merge key by key. The same
 * rules as the Mongo adapter's update.
 */
const applyTenantPatch = (
  current: TenantRecord | undefined,
  name: string,
  patch: TenantPatch
): TenantRecord => {
  const next: Record<string, unknown> = { ...current, name };

  Object.entries(patch).forEach(([field, value]) => {
    if (field === 'featureFlags' && isGroup(value)) {
      next.featureFlags = mergeFlags(current?.featureFlags, value);
    } else if (field === 'metadata' && isGroup(value)) {
      next.metadata = mergeGroup(current?.metadata, value);
    } else if (value === null) {
      delete next[field];
    } else if (value !== undefined) {
      next[field] = value;
    }
  });

  return next as TenantRecord;
};

export { applyTenantPatch, isGroup, mergeFlags, mergeGroup };
