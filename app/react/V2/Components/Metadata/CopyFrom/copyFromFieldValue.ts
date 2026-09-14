type CopyFromDisplayValue = {
  value?: unknown;
  label?: string;
  parent?: { value?: unknown; label?: string };
};

const isPrimitive = (value: unknown): value is string | number | boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

const formatLinkOrGeo = (record: Record<string, unknown>): string | undefined => {
  if (typeof record.url === 'string') {
    return (typeof record.label === 'string' && record.label) || record.url;
  }
  const latitude = record.lat ?? record.latitude;
  const longitude = record.lon ?? record.lng ?? record.longitude;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return `${latitude}, ${longitude}`;
  }
  return undefined;
};

const formatRange = (record: Record<string, unknown>): string => {
  const from = record.from == null ? '' : String(record.from);
  const to = record.to == null ? '' : String(record.to);
  if (from && to) {
    return `${from} ~ ${to}`;
  }
  return from || to;
};

const formatCopyFromEntry = (entry: CopyFromDisplayValue): string => {
  if (typeof entry.label === 'string' && entry.label) {
    return entry.parent?.label ? `${entry.parent.label} › ${entry.label}` : entry.label;
  }
  if (entry.value == null || entry.value === '') {
    return '';
  }
  if (isPrimitive(entry.value)) {
    return String(entry.value);
  }
  if (typeof entry.value !== 'object') {
    return '';
  }
  const record = entry.value as Record<string, unknown>;
  return formatLinkOrGeo(record) ?? formatRange(record);
};

const formatCopyFromValue = (entries?: CopyFromDisplayValue[]): string =>
  (entries ?? []).map(formatCopyFromEntry).filter(Boolean).join(', ');

const copyFromValueKey = (entries?: CopyFromDisplayValue[]) =>
  JSON.stringify(
    (entries ?? []).map(entry => ({
      value: entry.value ?? null,
      label: entry.label ?? null,
      parent: entry.parent ?? null,
    }))
  );

const copyFromValuesAreEqual = (current?: CopyFromDisplayValue[], next?: CopyFromDisplayValue[]) =>
  copyFromValueKey(current) === copyFromValueKey(next);

export { copyFromValuesAreEqual, formatCopyFromValue };
export type { CopyFromDisplayValue };
