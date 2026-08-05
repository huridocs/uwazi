export function serializePgValue(value: unknown, shouldStringify: boolean): unknown {
  if (value === null || value === undefined) return null;
  if (shouldStringify) return JSON.stringify(value);
  return value;
}
