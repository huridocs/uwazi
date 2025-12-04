import { ArrayUtils } from 'api/common.v2/utils/Array';
import { CacheOptions, CacheService } from './CacheService';

type KeyGenerator = (...args: any[]) => string;
type Key = string | KeyGenerator;

type InvalidateInput = Key[];

type CachedProps = {
  key: Key;
} & CacheOptions;

function Cached(options: CachedProps) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = (this as any)?.cache as CacheService | undefined;
      if (!cacheService) return original.apply(this, args);

      const key = typeof options.key === 'function' ? options.key(...args) : options.key;

      const cached = await cacheService.get(key);
      if (cached !== null && cached !== undefined) return cached;

      const result = await original.apply(this, args);
      await cacheService.set(key, result, options);

      return result;
    };
    return descriptor;
  };
}

function Invalidate(keys: InvalidateInput) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const result = await original.apply(this, args);

      const cacheService = (this as any).cache as CacheService | undefined;
      if (!cacheService) return result;

      await ArrayUtils.sequentialFor(keys, async k => {
        const key = typeof k === 'function' ? k(...args) : k;

        if (key.includes('*')) {
          await cacheService.deletePattern(key);
        } else {
          await cacheService.delete(key);
        }
      });

      return result;
    };
    return descriptor;
  };
}

export { Cached, Invalidate };
