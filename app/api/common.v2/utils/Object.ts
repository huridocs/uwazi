export class ObjectUtils {
  /**
   * Returns a shallow copy of `obj` with all keys whose value is `undefined` removed.
   * The original object is never mutated.
   */
  static sanitizeUndefined<T extends object>(obj: T): Partial<T> {
    const result = {} as Partial<T>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Returns a shallow copy of `obj` with the specified keys removed.
   * The original object is never mutated.
   */
  static sanitize<T extends object, K extends keyof T>(obj: T, keys: readonly K[]) {
    const result = { ...obj };

    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
}
