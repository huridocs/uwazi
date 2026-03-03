export function resolveDefaultExport<T>(
  module: T | { default: T } | null | undefined,
  fallback?: T,
  isValid: (v: T) => boolean = () => true
): T {
  const mod = module as { default?: T } | null | undefined;
  const resolved = (mod?.default ?? mod) as T;
  if (resolved != null && isValid(resolved)) return resolved;
  if (fallback !== undefined) return fallback;
  if (resolved != null) return resolved;
  throw new Error('resolveDefaultExport: no valid export');
}
